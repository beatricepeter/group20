# Visitors Backend

Spring Boot REST backend for `users`, `experts`, and `visitors`.

## Important
- Existing `User`, `Expert`, `Visitor`, and `Role` entities are preserved.
- The `system_settings` table stores the admin-configured automatic checkout time; JPA updates the schema based on `spring.jpa.hibernate.ddl-auto=update`.
- Visitor IDs are generated as UUID strings in the service layer.

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

### System settings
- `GET /api/settings` — returns the daily automatic checkout time (default `16:30`)
- `PUT /api/settings` — saves the daily automatic checkout time

Body:
```json
{"autoCheckoutTime":"18:00"}
```

The scheduled job checks every minute using `Africa/Dar_es_Salaam` time and checks out visitors who remain active at or after the configured time.

### Departments
- `GET /api/departments` — lists organisation departments
- `POST /api/departments` — adds a department
- `DELETE /api/departments/{id}` — removes a department from the list

Create body:
```json
{"name":"Human Resources"}
```

## Run
Make sure MySQL database `visitors_db` exists and the credentials in `src/main/resources/application.properties` match your environment.

Then:
```bash
./mvnw spring-boot:run
```

The current project uses Java 17 and Spring Boot 4.1.1.
