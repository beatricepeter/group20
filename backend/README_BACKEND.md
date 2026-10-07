# Visitors Backend

Spring Boot REST backend for `users`, `experts`, and `visitors`.

## Important
- **No entity file/column was changed.**
- Existing `User`, `Expert`, `Visitor`, and `Role` entities are preserved as provided.
- `spring.jpa.hibernate.ddl-auto=validate` remains in use, so Hibernate will not create or alter database columns.
- IDs are generated as UUID strings in the service layer.

## Layers
- `repository/` — Spring Data JPA repositories
- `service/` — business logic and database operations
- `controller/` — REST API endpoints
- `dto/` — request/response models (password is never returned)
- `exception/` — consistent API errors

## Endpoints

### Health
`GET /api/health`

### Authentication
`POST /api/auth/login`
```json
{"username":"admin","password":"secret"}
```

### Users
- `GET /api/users`
- `GET /api/users/{id}`
- `GET /api/users/by-username/{username}`
- `POST /api/users`
- `PUT /api/users/{id}`
- `DELETE /api/users/{id}`

Create/update body:
```json
{
  "fullname": "John Doe",
  "username": "john",
  "password": "secret",
  "role": "receptionist"
}
```
On update, `password` can be omitted to keep the existing password.

### Experts
- `GET /api/experts`
- `GET /api/experts/{id}`
- `POST /api/experts`
- `PUT /api/experts/{id}`
- `DELETE /api/experts/{id}`

Body:
```json
{"fullname":"Dr. Example","department":"ICT"}
```

An expert with assigned visitors cannot be deleted.

### Visitors
- `GET /api/visitors`
- `GET /api/visitors/{id}`
- `POST /api/visitors`
- `PUT /api/visitors/{id}`
- `PATCH /api/visitors/{id}/checkout`
- `DELETE /api/visitors/{id}`

Optional GET filters:
- `/api/visitors?expertId=...`
- `/api/visitors?active=true`
- `/api/visitors?from=2026-09-01&to=2026-09-14`

Create/update body:
```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "phone": "0712345678",
  "company": "Example Ltd",
  "idType": "National ID",
  "idNumber": "123456789",
  "expertId": "expert-uuid",
  "personToVisit": "Dr. Example",
  "purpose": "Meeting",
  "recordedBy": "Reception",
  "checkInDate": "2026-09-14T15:30:00"
}
```

Checkout:
```json
{"checkOutDate":"2026-09-14T17:00:00"}
```
Or send an empty JSON body to use the server's current time.

## Run
Make sure MySQL database `visitors_db` exists and the credentials in `src/main/resources/application.properties` match your environment.

Then:
```bash
./mvnw spring-boot:run
```

The current project uses Java 17 and Spring Boot 4.1.1.
