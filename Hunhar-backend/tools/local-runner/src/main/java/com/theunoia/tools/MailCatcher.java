package com.theunoia.tools;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Minimal SMTP sink + MailHog-compatible JSON API (GET /api/v2/messages, /api/v2/search?kind=to&query=)
 * and a tiny HTML inbox at "/". Lets the notification-service send real SMTP mail locally.
 */
final class MailCatcher {

    private final int smtpPort;
    private final int httpPort;
    private final List<Map<String, Object>> messages = Collections.synchronizedList(new ArrayList<>());
    private final ExecutorService pool = Executors.newCachedThreadPool();
    private final ObjectMapper json = new ObjectMapper();
    private ServerSocket smtp;
    private HttpServer http;

    MailCatcher(int smtpPort, int httpPort) {
        this.smtpPort = smtpPort;
        this.httpPort = httpPort;
    }

    void start() throws IOException {
        smtp = new ServerSocket(smtpPort);
        pool.submit(() -> {
            while (!smtp.isClosed()) {
                try {
                    Socket s = smtp.accept();
                    pool.submit(() -> session(s));
                } catch (IOException e) {
                    if (!smtp.isClosed()) LocalInfrastructure.log("SMTP accept failed: " + e.getMessage());
                }
            }
        });
        http = HttpServer.create(new InetSocketAddress(httpPort), 0);
        http.createContext("/api/v2/messages", ex -> respond(ex, page(messages)));
        http.createContext("/api/v2/search", ex -> {
            String query = param(ex, "query").toLowerCase(Locale.ROOT);
            List<Map<String, Object>> found;
            synchronized (messages) {
                found = messages.stream().filter(m -> String.valueOf(m.get("_to")).toLowerCase(Locale.ROOT).contains(query)).toList();
            }
            respond(ex, page(found));
        });
        http.createContext("/", this::inbox);
        http.setExecutor(pool);
        http.start();
    }

    void stop() throws IOException {
        smtp.close();
        http.stop(0);
        pool.shutdownNow();
    }

    private void session(Socket socket) {
        try (socket;
             BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
             PrintWriter out = new PrintWriter(socket.getOutputStream(), true, StandardCharsets.UTF_8)) {
            out.print("220 theunoia-local ESMTP\r\n");
            out.flush();
            String from = "";
            List<String> to = new ArrayList<>();
            String line;
            while ((line = in.readLine()) != null) {
                String cmd = line.toUpperCase(Locale.ROOT);
                if (cmd.startsWith("EHLO") || cmd.startsWith("HELO")) {
                    out.print("250-theunoia-local\r\n250 8BITMIME\r\n");
                } else if (cmd.startsWith("MAIL FROM")) {
                    from = line.substring(line.indexOf(':') + 1).trim();
                    out.print("250 OK\r\n");
                } else if (cmd.startsWith("RCPT TO")) {
                    to.add(line.substring(line.indexOf(':') + 1).trim().replaceAll("[<>]", ""));
                    out.print("250 OK\r\n");
                } else if (cmd.equals("DATA")) {
                    out.print("354 End data with <CR><LF>.<CR><LF>\r\n");
                    out.flush();
                    StringBuilder data = new StringBuilder();
                    String d;
                    while ((d = in.readLine()) != null && !d.equals(".")) {
                        data.append(d.startsWith("..") ? d.substring(1) : d).append("\r\n");
                    }
                    store(from, to, data.toString());
                    to = new ArrayList<>();
                    out.print("250 OK queued\r\n");
                } else if (cmd.equals("QUIT")) {
                    out.print("221 Bye\r\n");
                    out.flush();
                    return;
                } else {
                    out.print("250 OK\r\n"); // RSET, NOOP, ...
                }
                out.flush();
            }
        } catch (IOException ignored) {
            // client disconnected
        }
    }

    private void store(String from, List<String> to, String raw) {
        int split = raw.indexOf("\r\n\r\n");
        String headerBlock = split < 0 ? raw : raw.substring(0, split);
        String body = split < 0 ? "" : raw.substring(split + 4);
        Map<String, List<String>> headers = new LinkedHashMap<>();
        String last = null;
        for (String h : headerBlock.split("\r\n")) {
            if ((h.startsWith(" ") || h.startsWith("\t")) && last != null) {
                List<String> values = headers.get(last);
                values.set(values.size() - 1, values.get(values.size() - 1) + " " + h.trim());
                continue;
            }
            int c = h.indexOf(':');
            if (c <= 0) continue;
            last = h.substring(0, c).trim();
            headers.computeIfAbsent(last, k -> new ArrayList<>()).add(h.substring(c + 1).trim());
        }
        Map<String, Object> content = new LinkedHashMap<>();
        content.put("Headers", headers);
        content.put("Body", body);
        Map<String, Object> msg = new LinkedHashMap<>();
        msg.put("ID", Long.toString(System.nanoTime()));
        msg.put("From", from);
        msg.put("To", to);
        msg.put("Created", Instant.now().toString());
        msg.put("Content", content);
        msg.put("_to", String.join(",", to));
        messages.add(0, msg);
        LocalInfrastructure.log("mail to " + to + ": " + headers.getOrDefault("Subject", List.of("")).get(0));
    }

    private Map<String, Object> page(List<Map<String, Object>> list) {
        List<Map<String, Object>> copy;
        synchronized (messages) {
            copy = new ArrayList<>(list);
        }
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("total", copy.size());
        r.put("count", copy.size());
        r.put("start", 0);
        r.put("items", copy);
        return r;
    }

    private void respond(HttpExchange ex, Object body) throws IOException {
        byte[] bytes = json.writeValueAsBytes(body);
        ex.getResponseHeaders().add("Content-Type", "application/json");
        ex.sendResponseHeaders(200, bytes.length);
        try (OutputStream os = ex.getResponseBody()) {
            os.write(bytes);
        }
    }

    private void inbox(HttpExchange ex) throws IOException {
        StringBuilder html = new StringBuilder("<html><head><meta charset='utf-8'><title>THEUNOiA local inbox</title></head>"
                + "<body style='font-family:Arial;max-width:900px;margin:auto'><h2>THEUNOiA local inbox</h2>");
        synchronized (messages) {
            if (messages.isEmpty()) html.append("<p>No emails yet.</p>");
            for (Map<String, Object> m : messages) {
                @SuppressWarnings("unchecked")
                Map<String, List<String>> h = (Map<String, List<String>>) ((Map<String, Object>) m.get("Content")).get("Headers");
                html.append("<div style='border:1px solid #ddd;padding:12px;margin:10px 0'><b>")
                        .append(escape(h.getOrDefault("Subject", List.of("(no subject)")).get(0))).append("</b><br>To: ")
                        .append(escape(String.valueOf(m.get("_to")))).append(" &middot; ").append(m.get("Created")).append("</div>");
            }
        }
        byte[] bytes = html.append("</body></html>").toString().getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().add("Content-Type", "text/html; charset=utf-8");
        ex.sendResponseHeaders(200, bytes.length);
        try (OutputStream os = ex.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static String param(HttpExchange ex, String name) {
        String q = ex.getRequestURI().getRawQuery();
        if (q == null) return "";
        for (String p : q.split("&")) {
            int i = p.indexOf('=');
            if (i > 0 && p.substring(0, i).equals(name)) return URLDecoder.decode(p.substring(i + 1), StandardCharsets.UTF_8);
        }
        return "";
    }

    private static String escape(String s) {
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
