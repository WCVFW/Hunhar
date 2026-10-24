package com.theunoia.tools;

import com.github.fppt.jedismock.RedisServer;
import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.apache.qpid.server.SystemLauncher;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;

/**
 * Local infrastructure for running THEUNOiA without Docker (developer tool only).
 * Production / Docker Compose / Kubernetes use the real PostgreSQL, RabbitMQ, Redis and MailHog/SMTP.
 */
public final class LocalInfrastructure {

    static final int PG_PORT = Integer.getInteger("pg.port", 5433);
    static final int AMQP_PORT = Integer.getInteger("amqp.port", 5672);
    static final int REDIS_PORT = Integer.getInteger("redis.port", 6379);
    static final int SMTP_PORT = Integer.getInteger("smtp.port", 1025);
    static final int MAIL_HTTP_PORT = Integer.getInteger("mail.http.port", 8025);
    static final List<String> SERVICES = List.of("auth", "user", "project", "credit", "payment", "messaging",
            "notification", "community", "content", "analytics", "file");

    public static void main(String[] args) throws Exception {
        Path home = Path.of(System.getProperty("data.dir", ".local-data")).toAbsolutePath();
        Files.createDirectories(home);

        EmbeddedPostgres pg = startPostgres(home.resolve("postgres"));
        provisionDatabases();
        SystemLauncher broker = startBroker(home.resolve("qpid"));
        RedisServer redis = RedisServer.newRedisServer(REDIS_PORT);
        redis.start();
        log("Redis protocol server on :" + REDIS_PORT);
        MailCatcher mail = new MailCatcher(SMTP_PORT, MAIL_HTTP_PORT);
        mail.start();
        log("SMTP mail catcher on :" + SMTP_PORT + ", inbox http://localhost:" + MAIL_HTTP_PORT);

        CountDownLatch stop = new CountDownLatch(1);
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            log("Shutting down local infrastructure");
            try { mail.stop(); } catch (Exception ignored) { }
            try { redis.stop(); } catch (Exception ignored) { }
            try { broker.shutdown(); } catch (Exception ignored) { }
            try { pg.close(); } catch (Exception ignored) { }
            stop.countDown();
        }));
        log("LOCAL INFRASTRUCTURE READY");
        stop.await();
    }

    private static EmbeddedPostgres startPostgres(Path dataDir) throws Exception {
        Files.createDirectories(dataDir);
        EmbeddedPostgres pg = EmbeddedPostgres.builder()
                .setPort(PG_PORT)
                .setDataDirectory(dataDir)
                .setCleanDataDirectory(false)
                .setServerConfig("max_connections", "300")
                .setServerConfig("shared_buffers", "64MB")
                .start();
        log("PostgreSQL on :" + PG_PORT + " (data: " + dataDir + ")");
        return pg;
    }

    /** Same result as docker/postgres/init-databases.sh: one database + one owner role per service. */
    private static void provisionDatabases() throws Exception {
        String url = "jdbc:postgresql://localhost:" + PG_PORT + "/postgres";
        try (Connection c = DriverManager.getConnection(url, "postgres", "postgres"); Statement st = c.createStatement()) {
            for (String svc : SERVICES) {
                String role = svc + "_user";
                String db = svc + "_db";
                try (ResultSet rs = st.executeQuery("SELECT 1 FROM pg_roles WHERE rolname = '" + role + "'")) {
                    if (!rs.next()) st.execute("CREATE ROLE " + role + " LOGIN PASSWORD '" + svc + "_pass'");
                }
                try (ResultSet rs = st.executeQuery("SELECT 1 FROM pg_database WHERE datname = '" + db + "'")) {
                    if (!rs.next()) st.execute("CREATE DATABASE " + db + " OWNER " + role);
                }
            }
        }
        for (String svc : SERVICES) {
            try (Connection c = DriverManager.getConnection("jdbc:postgresql://localhost:" + PG_PORT + "/" + svc + "_db",
                    "postgres", "postgres"); Statement st = c.createStatement()) {
                st.execute("ALTER SCHEMA public OWNER TO " + svc + "_user");
            }
        }
        log("Provisioned " + SERVICES.size() + " service databases");
    }

    private static SystemLauncher startBroker(Path workDir) throws Exception {
        Files.createDirectories(workDir);
        String config = """
                {
                  "name": "theunoia-local",
                  "modelVersion": "9.0",
                  "authenticationproviders": [{
                    "name": "plain", "type": "Plain", "secureOnlyMechanisms": [],
                    "users": [{"name": "guest", "password": "guest", "type": "managed"}]
                  }],
                  "ports": [{
                    "name": "AMQP", "port": "%d", "authenticationProvider": "plain",
                    "virtualhostaliases": [
                      {"name": "nameAlias", "type": "nameAlias"},
                      {"name": "defaultAlias", "type": "defaultAlias"},
                      {"name": "anyAlias", "type": "patternMatchingAlias", "pattern": ".*", "virtualHostNode": "default"}
                    ]
                  }],
                  "virtualhostnodes": [{
                    "name": "default", "type": "Memory", "defaultVirtualHostNode": "true",
                    "virtualHostInitialConfiguration": "{\\"type\\": \\"Memory\\"}"
                  }]
                }""".formatted(AMQP_PORT);
        Path configFile = workDir.resolve("qpid-config.json");
        Files.writeString(configFile, config, StandardCharsets.UTF_8);
        System.setProperty("QPID_WORK", workDir.toString());

        Map<String, Object> attributes = new HashMap<>();
        attributes.put("type", "Memory");
        attributes.put("initialConfigurationLocation", configFile.toUri().toString());
        attributes.put("startupLoggedToSystemOut", false);
        SystemLauncher launcher = new SystemLauncher();
        launcher.startup(attributes);
        log("AMQP 0-9-1 broker on :" + AMQP_PORT + " (guest/guest)");
        return launcher;
    }

    static void log(String msg) {
        System.out.println("[local-infra] " + msg);
        System.out.flush();
    }
}
