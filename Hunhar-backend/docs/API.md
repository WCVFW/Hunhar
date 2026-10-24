# THEUNOiA API Reference

All client traffic goes through the gateway: `https://api.theunoia.com` (local: `http://localhost:8080`).
Send `Authorization: Bearer <accessToken>` (from `/api/v1/auth/login`). Errors share one shape:
```json
{"timestamp":"...","status":422,"code":"VALIDATION_ERROR","message":"Request validation failed","path":"/api/v1/...","details":{"field":"reason"}}
```
Pagination: `?page=0&size=20` returns `{items, page, size, totalItems, totalPages}`. Money: INR decimals. Times: ISO-8601 UTC.

Access legend: **Public** = no token required (a token is still honoured) · **Authenticated** = any signed-in user · role names = required role · `+ ACTIVE` = account must be verified and approved. Ownership/participation rules are additionally enforced in the service layer.

WebSocket chat: `wss://api.theunoia.com/ws?access_token=<jwt>` (STOMP). Subscribe `/user/queue/messages`, `/user/queue/typing`; send to `/app/conversations/{id}/send`, `/app/conversations/{id}/typing`.

Interactive OpenAPI docs per service (direct access, dev only): `http://localhost:808X/swagger-ui.html`.

## api-gateway

| Method | Path | Access | Operation |
|---|---|---|---|
| `GET` | `/api/v1/dashboard/freelancer` | FREELANCER | aggregated: active projects, pending bids, deadlines, earnings, credits, notifications, ranking |
| `GET` | `/api/v1/dashboard/client` | CLIENT | aggregated: projects by status, bids to review, payments, notifications, calendar |

## auth-service

| Method | Path | Access | Operation |
|---|---|---|---|
| `GET` | `/api/v1/admin/users` | ADMIN | list |
| `GET` | `/api/v1/admin/users/stats` | ADMIN | stats |
| `GET` | `/api/v1/admin/users/{id}` | ADMIN | details |
| `POST` | `/api/v1/admin/users/{id}/approve` | ADMIN | approve |
| `POST` | `/api/v1/admin/users/{id}/reject` | ADMIN | reject |
| `POST` | `/api/v1/admin/users/{id}/suspend` | ADMIN | suspend |
| `POST` | `/api/v1/admin/users/{id}/reactivate` | ADMIN | reactivate |
| `POST` | `/api/v1/admin/users/{id}/kyc/manual-verify` | ADMIN | manualKyc |
| `POST` | `/api/v1/auth/register/freelancer` | Public | registerFreelancer |
| `POST` | `/api/v1/auth/register/client` | Public | registerClient |
| `POST` | `/api/v1/auth/login` | Public | login |
| `POST` | `/api/v1/auth/refresh` | Public | refresh |
| `POST` | `/api/v1/auth/logout` | Public | logout |
| `POST` | `/api/v1/auth/logout-all` | Authenticated | logoutAll |
| `GET` | `/api/v1/auth/me` | Authenticated | me |
| `POST` | `/api/v1/auth/verify-email` | Public | verifyEmail |
| `POST` | `/api/v1/auth/resend-verification` | Authenticated | resendVerification |
| `POST` | `/api/v1/auth/forgot-password` | Public | forgotPassword |
| `POST` | `/api/v1/auth/reset-password` | Public | resetPassword |
| `POST` | `/api/v1/auth/change-password` | Authenticated | changePassword |
| `POST` | `/api/v1/auth/kyc/aadhaar/initiate` | Authenticated | initiateKyc |
| `GET` | `/api/v1/auth/kyc/aadhaar/status` | Authenticated | kycStatus |

## user-service

| Method | Path | Access | Operation |
|---|---|---|---|
| `GET` | `/api/v1/users/freelancers` | Authenticated | searchFreelancers |
| `GET` | `/api/v1/users/freelancers/{userId}` | Public | freelancer |
| `GET` | `/api/v1/users/clients/{userId}` | Public | client |
| `GET` | `/api/v1/users/leaderboard` | Public | leaderboard |
| `GET` | `/api/v1/users/me` | Authenticated | me |
| `GET` | `/api/v1/users/me/stats` | FREELANCER | myStats |
| `PUT` | `/api/v1/users/me/freelancer-profile` | FREELANCER | updateFreelancer |
| `PUT` | `/api/v1/users/me/skills` | FREELANCER | updateSkills |
| `POST` | `/api/v1/users/me/portfolio` | FREELANCER | addPortfolio |
| `PUT` | `/api/v1/users/me/portfolio/{id}` | FREELANCER | updatePortfolio |
| `DELETE` | `/api/v1/users/me/portfolio/{id}` | FREELANCER | deletePortfolio |
| `POST` | `/api/v1/users/me/experiences` | FREELANCER | addExperience |
| `PUT` | `/api/v1/users/me/experiences/{id}` | FREELANCER | updateExperience |
| `DELETE` | `/api/v1/users/me/experiences/{id}` | FREELANCER | deleteExperience |
| `POST` | `/api/v1/users/me/certifications` | FREELANCER | addCertification |
| `PUT` | `/api/v1/users/me/certifications/{id}` | FREELANCER | updateCertification |
| `DELETE` | `/api/v1/users/me/certifications/{id}` | FREELANCER | deleteCertification |
| `PUT` | `/api/v1/users/me/client-profile` | CLIENT | updateClient |

## project-service

| Method | Path | Access | Operation |
|---|---|---|---|
| `GET` | `/api/v1/categories` | Public | categories |
| `POST` | `/api/v1/admin/categories` | ADMIN | createCategory |
| `PUT` | `/api/v1/admin/categories/{id}` | ADMIN | updateCategory |
| `GET` | `/api/v1/admin/projects` | ADMIN | listProjects |
| `PATCH` | `/api/v1/admin/projects/{id}/status` | ADMIN | changeStatus |
| `GET` | `/api/v1/admin/bids` | ADMIN | bidsForProject |
| `GET` | `/api/v1/admin/disputes` | ADMIN | listDisputes |
| `POST` | `/api/v1/admin/disputes/{id}/review` | ADMIN | startReview |
| `POST` | `/api/v1/admin/disputes/{id}/resolve` | ADMIN | resolve |
| `GET` | `/api/v1/bids/mine` | FREELANCER | myBids |
| `PUT` | `/api/v1/bids/{bidId}` | FREELANCER | updateBid |
| `POST` | `/api/v1/bids/{bidId}/withdraw` | FREELANCER | withdraw |
| `POST` | `/api/v1/bids/{bidId}/shortlist` | CLIENT | shortlist |
| `DELETE` | `/api/v1/bids/{bidId}/shortlist` | CLIENT | unshortlist |
| `POST` | `/api/v1/bids/{bidId}/award` | CLIENT + ACTIVE | award |
| `PUT` | `/api/v1/milestones/{milestoneId}` | CLIENT | updateMilestone |
| `DELETE` | `/api/v1/milestones/{milestoneId}` | CLIENT | cancelMilestone |
| `POST` | `/api/v1/milestones/{milestoneId}/submit` | FREELANCER | submit |
| `POST` | `/api/v1/milestones/{milestoneId}/approve` | CLIENT | approve |
| `POST` | `/api/v1/milestones/{milestoneId}/request-revision` | CLIENT | revision |
| `GET` | `/api/v1/team-invitations` | FREELANCER | invitations |
| `POST` | `/api/v1/team-invitations/{id}/accept` | FREELANCER | accept |
| `POST` | `/api/v1/team-invitations/{id}/decline` | FREELANCER | decline |
| `GET` | `/api/v1/reviews/users/{userId}` | Public | reviewsForUser |
| `GET` | `/api/v1/reviews/projects/{projectId}` | Public | reviewsForProject |
| `GET` | `/api/v1/projects` | Public | browse |
| `GET` | `/api/v1/projects/{id}` | Public | get |
| `POST` | `/api/v1/projects` | CLIENT + ACTIVE | create |
| `PUT` | `/api/v1/projects/{id}` | CLIENT | update |
| `POST` | `/api/v1/projects/{id}/publish` | CLIENT + ACTIVE | publish |
| `POST` | `/api/v1/projects/{id}/cancel` | CLIENT | cancel |
| `POST` | `/api/v1/projects/{id}/attachments` | CLIENT | attach |
| `GET` | `/api/v1/projects/mine` | Public | mine |
| `GET` | `/api/v1/projects/dashboard/freelancer` | FREELANCER | freelancerDashboard |
| `GET` | `/api/v1/projects/dashboard/client` | CLIENT | clientDashboard |
| `POST` | `/api/v1/projects/{id}/bids` | FREELANCER + ACTIVE | bid |
| `GET` | `/api/v1/projects/{id}/bids` | CLIENT / ADMIN | projectBids |
| `GET` | `/api/v1/projects/{id}/workspace` | Authenticated | workspace |
| `POST` | `/api/v1/projects/{id}/milestones` | CLIENT | addMilestone |
| `POST` | `/api/v1/projects/{id}/updates` | Authenticated | postUpdate |
| `POST` | `/api/v1/projects/{id}/complete` | CLIENT | complete |
| `POST` | `/api/v1/projects/{id}/team` | FREELANCER | invite |
| `DELETE` | `/api/v1/projects/{id}/team/{invitationId}` | Authenticated | removeMember |
| `POST` | `/api/v1/projects/{id}/reviews` | Authenticated | review |
| `POST` | `/api/v1/projects/{id}/disputes` | Authenticated | raiseDispute |
| `GET` | `/api/v1/projects/{id}/disputes` | Authenticated | disputes |

## credit-service

| Method | Path | Access | Operation |
|---|---|---|---|
| `GET` | `/api/v1/credits/me` | Authenticated | myAccount |
| `GET` | `/api/v1/credits/me/transactions` | Authenticated | myTransactions |
| `GET` | `/api/v1/credits/packages` | Public | packages |
| `POST` | `/api/v1/credits/purchase` | FREELANCER | purchase |
| `POST` | `/api/v1/admin/credits/allocate` | ADMIN | allocate |
| `GET` | `/api/v1/admin/credits/accounts/{userId}` | ADMIN | account |
| `GET` | `/api/v1/admin/credits/transactions` | ADMIN | transactions |
| `GET` | `/api/v1/admin/credits/summary` | ADMIN | summary |
| `GET` | `/api/v1/admin/credits/packages` | ADMIN | allPackages |
| `POST` | `/api/v1/admin/credits/packages` | ADMIN | createPackage |
| `PUT` | `/api/v1/admin/credits/packages/{id}` | ADMIN | updatePackage |
| `POST` | `/internal/credits/debit` | Authenticated | debit |
| `POST` | `/internal/credits/refund` | Authenticated | refund |

## payment-service

| Method | Path | Access | Operation |
|---|---|---|---|
| `GET` | `/api/v1/admin/payments/summary` | ADMIN | summary |
| `GET` | `/api/v1/admin/payments/orders` | ADMIN | orders |
| `GET` | `/api/v1/admin/payments/transactions` | ADMIN | transactions |
| `GET` | `/api/v1/admin/payments/escrows` | ADMIN | escrows |
| `GET` | `/api/v1/admin/payments/commissions/monthly` | ADMIN | commissions |
| `GET` | `/api/v1/admin/payments/withdrawals` | ADMIN | withdrawals |
| `POST` | `/api/v1/admin/payments/withdrawals/{id}/approve` | ADMIN | approveWithdrawal |
| `POST` | `/api/v1/admin/payments/withdrawals/{id}/reject` | ADMIN | rejectWithdrawal |
| `GET` | `/api/v1/admin/payments/refunds` | ADMIN | refunds |
| `POST` | `/api/v1/admin/payments/refunds/{id}/approve` | ADMIN | approveRefund |
| `POST` | `/api/v1/admin/payments/refunds/{id}/reject` | ADMIN | rejectRefund |
| `GET` | `/api/v1/admin/payments/invoices` | ADMIN | invoices |
| `POST` | `/api/v1/payments/orders` | CLIENT + ACTIVE | fundMilestone |
| `GET` | `/api/v1/payments/orders/{id}` | Authenticated | order |
| `POST` | `/api/v1/payments/verify` | Authenticated | verify |
| `POST` | `/api/v1/payments/mock/{orderId}/capture` | Authenticated | mockCapture |
| `POST` | `/api/v1/payments/refunds` | CLIENT | requestRefund |
| `POST` | `/api/v1/payments/direct` | CLIENT | recordDirect |
| `POST` | `/api/v1/payments/direct/{id}/confirm` | FREELANCER | confirmDirect |
| `POST` | `/api/v1/payments/direct/{id}/dispute` | FREELANCER | disputeDirect |
| `GET` | `/api/v1/payments/direct` | Authenticated | directForProject |
| `GET` | `/api/v1/payments/wallet` | Authenticated | wallet |
| `GET` | `/api/v1/payments/transactions` | Authenticated | transactions |
| `POST` | `/api/v1/payments/payout-accounts` | FREELANCER | addPayoutAccount |
| `GET` | `/api/v1/payments/payout-accounts` | Authenticated | payoutAccounts |
| `DELETE` | `/api/v1/payments/payout-accounts/{id}` | Authenticated | removePayoutAccount |
| `POST` | `/api/v1/payments/withdrawals` | FREELANCER + ACTIVE | withdraw |
| `GET` | `/api/v1/payments/withdrawals` | Authenticated | myWithdrawals |
| `GET` | `/api/v1/payments/invoices` | Authenticated | invoices |
| `GET` | `/api/v1/payments/invoices/{id}` | Authenticated | invoice |
| `GET` | `/api/v1/payments/invoices/{id}/pdf` | Authenticated | invoicePdf |
| `POST` | `/api/v1/webhooks/{provider}` | Public | receive |

## messaging-service

| Method | Path | Access | Operation |
|---|---|---|---|
| `POST` | `/api/v1/conversations` | Authenticated | openDirect |
| `GET` | `/api/v1/conversations` | Authenticated | list |
| `GET` | `/api/v1/conversations/unread-count` | Authenticated | unread |
| `GET` | `/api/v1/conversations/{id}/messages` | Authenticated | history |
| `POST` | `/api/v1/conversations/{id}/messages` | Authenticated | send |
| `POST` | `/api/v1/conversations/{id}/read` | Authenticated | read |
| `DELETE` | `/api/v1/conversations/messages/{messageId}` | Authenticated | delete |

## notification-service

| Method | Path | Access | Operation |
|---|---|---|---|
| `GET` | `/api/v1/notifications` | Authenticated | list |
| `GET` | `/api/v1/notifications/unread-count` | Authenticated | unread |
| `POST` | `/api/v1/notifications/{id}/read` | Authenticated | read |
| `POST` | `/api/v1/notifications/read-all` | Authenticated | readAll |
| `GET` | `/api/v1/notifications/preferences` | Authenticated | preferences |
| `PUT` | `/api/v1/notifications/preferences` | Authenticated | updatePreferences |
| `GET` | `/api/v1/calendar/events` | Authenticated | events |
| `GET` | `/api/v1/calendar/events/upcoming` | Authenticated | upcoming |
| `POST` | `/api/v1/calendar/events` | Authenticated | create |
| `PUT` | `/api/v1/calendar/events/{id}` | Authenticated | update |
| `DELETE` | `/api/v1/calendar/events/{id}` | Authenticated | delete |
| `GET` | `/api/v1/calendar/google/connect` | Authenticated | connectGoogle |
| `GET` | `/api/v1/calendar/google/callback` | Public | googleCallback |
| `DELETE` | `/api/v1/calendar/google` | Authenticated | disconnectGoogle |
| `POST` | `/api/v1/admin/notifications/campaigns` | ADMIN | campaign |
| `GET` | `/api/v1/admin/notifications/campaigns` | ADMIN | campaigns |
| `GET` | `/api/v1/admin/notifications/delivery-logs` | ADMIN | deliveryLogs |

## community-service

| Method | Path | Access | Operation |
|---|---|---|---|
| `GET` | `/api/v1/community/categories` | Public | categories |
| `GET` | `/api/v1/community/threads` | Public | feed |
| `GET` | `/api/v1/community/threads/{id}` | Public | thread |
| `GET` | `/api/v1/community/users/{userId}/network` | Public | network |
| `POST` | `/api/v1/community/threads` | Public | create |
| `PUT` | `/api/v1/community/threads/{id}` | Public | update |
| `DELETE` | `/api/v1/community/threads/{id}` | Public | delete |
| `POST` | `/api/v1/community/threads/{id}/replies` | Authenticated | reply |
| `PUT` | `/api/v1/community/replies/{replyId}` | Authenticated | editReply |
| `POST` | `/api/v1/community/threads/{id}/accept/{replyId}` | Authenticated | accept |
| `POST` | `/api/v1/community/votes` | Authenticated | vote |
| `POST` | `/api/v1/community/reports` | Authenticated | report |
| `POST` | `/api/v1/community/follow/{userId}` | Authenticated | follow |
| `DELETE` | `/api/v1/community/follow/{userId}` | Authenticated | unfollow |
| `GET` | `/api/v1/admin/community/reports` | ADMIN | reports |
| `POST` | `/api/v1/admin/community/reports/{id}/resolve` | ADMIN | resolve |
| `POST` | `/api/v1/admin/community/moderate` | ADMIN | moderate |
| `POST` | `/api/v1/admin/community/categories` | ADMIN | createCategory |
| `PUT` | `/api/v1/admin/community/categories/{id}` | ADMIN | updateCategory |

## content-service

| Method | Path | Access | Operation |
|---|---|---|---|
| `GET` | `/api/v1/content/pages/{slug}` | Public | page |
| `GET` | `/api/v1/content/blog/categories` | Public | categories |
| `GET` | `/api/v1/content/blog/posts` | Public | posts |
| `GET` | `/api/v1/content/blog/posts/{slug}` | Public | post |
| `GET` | `/api/v1/content/blog/posts/{slug}/recommendations` | Public | recommendations |
| `GET` | `/api/v1/content/faqs` | Public | faqs |
| `POST` | `/api/v1/content/contact` | Public | contact |
| `POST` | `/api/v1/content/leads` | Public | lead |
| `GET` | `/sitemap.xml` | Public | sitemap |
| `GET` | `/api/v1/admin/content/pages` | ADMIN | allPages |
| `POST` | `/api/v1/admin/content/pages` | ADMIN | createPage |
| `PUT` | `/api/v1/admin/content/pages/{id}` | ADMIN | updatePage |
| `GET` | `/api/v1/admin/content/posts` | ADMIN | allPosts |
| `POST` | `/api/v1/admin/content/posts` | ADMIN | createPost |
| `PUT` | `/api/v1/admin/content/posts/{id}` | ADMIN | updatePost |
| `DELETE` | `/api/v1/admin/content/posts/{id}` | ADMIN | deletePost |
| `POST` | `/api/v1/admin/content/blog-categories` | ADMIN | createCategory |
| `POST` | `/api/v1/admin/content/faqs` | ADMIN | createFaq |
| `PUT` | `/api/v1/admin/content/faqs/{id}` | ADMIN | updateFaq |
| `DELETE` | `/api/v1/admin/content/faqs/{id}` | ADMIN | deleteFaq |
| `GET` | `/api/v1/admin/content/inquiries` | ADMIN | inquiries |
| `PATCH` | `/api/v1/admin/content/inquiries/{id}` | ADMIN | updateInquiry |
| `GET` | `/api/v1/admin/content/leads` | ADMIN | leads |
| `GET` | `/api/v1/admin/content/leads/export` | ADMIN | exportLeads |

## analytics-service

| Method | Path | Access | Operation |
|---|---|---|---|
| `GET` | `/api/v1/admin/analytics/dashboard` | ADMIN | dashboard |
| `GET` | `/api/v1/admin/analytics/trends` | ADMIN | trend |
| `GET` | `/api/v1/admin/analytics/monthly` | ADMIN | monthly |
| `GET` | `/api/v1/admin/analytics/metrics` | ADMIN | metrics |
| `POST` | `/api/v1/admin/analytics/rollups/refresh` | ADMIN | refresh |

## file-service

| Method | Path | Access | Operation |
|---|---|---|---|
| `POST` | `/api/v1/files` | Authenticated | upload |
| `GET` | `/api/v1/files/mine` | Authenticated | mine |
| `GET` | `/api/v1/files/{id}` | Authenticated | metadata |
| `GET` | `/api/v1/files/{id}/download` | Authenticated | download |
| `GET` | `/api/v1/files/public/{id}/download` | Public | publicDownload |
| `DELETE` | `/api/v1/files/{id}` | Authenticated | delete |
