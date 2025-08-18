# CODING PRINCIPLES FOR LLM

When writing code, strictly follow these fundamental software engineering principles:

## Core Philosophy

**KISS (Keep It Simple, Stupid)**
- Choose straightforward solutions over complex ones
- Write self-documenting code
- Prefer composition over inheritance
- Avoid premature abstractions

**YAGNI (You Aren't Gonna Need It)**
- Build only what's currently needed
- Don't add functionality for imagined future requirements
- Refactor when requirements actually change

**DRY (Don't Repeat Yourself)**
- Extract common functionality into reusable components
- Use constants for repeated values
- Create shared utilities for common operations

## SOLID Principles

**Single Responsibility**: Each class/function should have one reason to change
**Interface Segregation**: Don't force clients to depend on unused interfaces
**Dependency Inversion**: Depend on abstractions, not concretions

## Code Structure Requirements

**Functions:**
- Keep under 20 lines when possible
- Do one thing well
- Use descriptive names that explain purpose
- Maximum 3-4 parameters
- Return early to reduce nesting

**Classes:**
- Single responsibility
- Keep under 100 lines when possible
- Use composition over inheritance
- Make dependencies explicit through constructor injection

**Error Handling:**
- Fail fast - validate inputs immediately
- Create specific exception types for different error categories
- Always handle or propagate errors, never ignore them
- Log errors with context

## Naming Conventions

**Be Descriptive:**
- `calculateOrderTotal()` not `calc()`
- `isUserAuthenticated` not `isAuth`
- `MAX_RETRY_ATTEMPTS` not `MAX_RETRIES`

**Standard Cases:**
- Classes/Types: `PascalCase`
- Functions/Variables: `camelCase` or `snake_case` (stay consistent)
- Constants: `UPPER_SNAKE_CASE`
- Private members: `_leadingUnderscore` or language convention

## Testing Requirements

**Write Tests First (TDD):**
1. Write failing test that defines behavior
2. Write minimal code to pass test
3. Refactor while keeping tests green

**Test Structure:**
- Arrange, Act, Assert pattern
- One assertion per test when possible
- Descriptive test names: `should_return_total_with_tax_when_calculating_order`
- Test happy path, edge cases, and error conditions

## Architecture Patterns

**Layered Architecture:**
```
Presentation → Application → Domain → Infrastructure
```

**Dependency Flow:**
- Dependencies point inward toward domain
- Outer layers depend on inner layers, never reverse
- Use interfaces to decouple layers
- Inject dependencies through constructors

**Separation of Concerns:**
- Controllers handle HTTP/UI concerns
- Services contain business logic
- Repositories handle data access
- Models represent domain concepts

## Configuration Management

- Store configuration in environment variables
- Validate configuration at startup
- Provide sensible defaults for development
- Never commit secrets to code
- Use typed configuration objects

## Performance Considerations

**Profile Before Optimizing:**
- Measure performance with real data
- Identify actual bottlenecks, don't guess
- Focus on the 20% of code that affects 80% of performance

**Database Optimization:**
- Use appropriate indexes for query patterns
- Avoid N+1 queries - use joins or bulk operations
- Paginate large result sets
- Use connection pooling
- Cache frequently accessed data

**API and Network:**
- Minimize HTTP requests
- Use caching headers appropriately
- Compress large responses
- Implement request timeouts
- Use async/await for I/O operations

**Memory Management:**
- Avoid memory leaks - clean up resources
- Use appropriate data structures for the task
- Stream large files instead of loading into memory
- Be mindful of object creation in loops

**When NOT to Optimize:**
- During initial development (get it working first)
- When performance is already acceptable
- Without measuring actual impact
- At the expense of code readability

## Security Best Practices

**Input Validation:**
- Validate all user inputs at system boundaries
- Use allowlists rather than blocklists when possible
- Sanitize data before processing or storage
- Validate data types, lengths, formats, and ranges

**Authentication & Authorization:**
- Never store passwords in plain text
- Use strong hashing algorithms (bcrypt, Argon2)
- Implement proper session management
- Check authorization for every protected resource
- Use principle of least privilege

**Data Protection:**
- Encrypt sensitive data at rest and in transit
- Use HTTPS for all communication
- Never log sensitive information (passwords, tokens, PII)
- Implement secure random token generation
- Use environment variables for secrets

**Common Vulnerabilities to Avoid:**
- SQL injection (use parameterized queries)
- Cross-site scripting (XSS) - escape output
- Cross-site request forgery (CSRF) - use tokens
- Insecure direct object references - check ownership
- Information disclosure through error messages

**Secure Coding Practices:**
- Keep dependencies updated
- Use security linters and scanners
- Implement rate limiting for APIs
- Log security events for monitoring
- Fail securely (deny by default)

## Code Quality Checklist

Before completing any code:

**Functionality:**
- [ ] Code works as intended
- [ ] Edge cases are handled
- [ ] Errors are properly managed
- [ ] Input validation is present

**Design:**
- [ ] Follows SOLID principles
- [ ] Single responsibility per component
- [ ] Dependencies are injected
- [ ] Abstractions are used appropriately

**Readability:**
- [ ] Code is self-documenting
- [ ] Names are descriptive and consistent
- [ ] Functions are small and focused
- [ ] Comments explain why, not what

**Testing:**
- [ ] Unit tests cover core logic
- [ ] Integration tests verify component interaction
- [ ] Error cases are tested
- [ ] Tests are fast and reliable

## Language-Specific Guidelines

**When writing in any language:**
- Follow the language's established conventions
- Use the language's standard formatting tools
- Leverage language-specific features appropriately
- Import only what you need

**Documentation:**
- Add docstrings/comments for public APIs
- Explain complex business logic
- Document assumptions and constraints
- Keep documentation close to code

## Example Code Structure

```javascript
// ✅ Good: Clear structure, single responsibility, proper error handling
class OrderService {
    constructor(paymentService, inventoryService, emailService) {
        this.paymentService = paymentService;
        this.inventoryService = inventoryService;
        this.emailService = emailService;
    }
    
    async processOrder(orderRequest) {
        this.validateOrderRequest(orderRequest);
        
        await this.checkInventoryAvailability(orderRequest.items);
        const payment = await this.processPayment(orderRequest.payment);
        const order = await this.createOrder(orderRequest, payment);
        
        await this.emailService.sendConfirmation(order);
        
        return { orderId: order.id, status: 'completed' };
    }
    
    validateOrderRequest(request) {
        if (!request.items?.length) {
            throw new ValidationError('Order must contain at least one item');
        }
        if (!request.payment) {
            throw new ValidationError('Payment information is required');
        }
    }
}
```

## Common Anti-Patterns to Avoid

- Large objects that handle too many responsibilities
- Long parameter lists (use objects instead)
- Deep nesting (use early returns)
- Magic numbers/strings (use named constants)
- Ignored exceptions
- Tight coupling between components
- Duplicate code across multiple places

**Remember: Write code as if the person maintaining it is a violent psychopath who knows where you live. Code should be so clear that anyone can understand and modify it safely.**