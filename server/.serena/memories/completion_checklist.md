# Task Completion Checklist

## When a Task is Completed

### Code Quality Checks
- [ ] **Run frontend build**: `npm run build` to check for build errors
- [ ] **Check console**: Browser console should be free of errors/warnings
- [ ] **Test core functionality**: Send message, create branch, navigate between branches
- [ ] **Validate data**: Check localStorage for proper data structure

### Backend Validation
- [ ] **Health check**: `curl http://localhost:3001/api/health` should return healthy status
- [ ] **API functionality**: Test both `/api/chat` and `/api/generate-branch-name` endpoints
- [ ] **Error handling**: Verify graceful handling of API failures
- [ ] **Logs review**: Check server logs for any errors or warnings

### Integration Testing
- [ ] **Full workflow**: Complete user journey from message to branch creation
- [ ] **Navigation**: Test breadcrumbs and sidebar tree navigation
- [ ] **Context preservation**: Verify branch messages maintain conversation history
- [ ] **Cross-browser**: Test in different browsers if UI changes made

### Performance Checks
- [ ] **Load time**: Application should load quickly on localhost
- [ ] **Response time**: Claude API responses should be reasonable (<10s typical)
- [ ] **Memory usage**: No significant memory leaks in browser DevTools
- [ ] **Bundle size**: Check if build size is reasonable with `npm run build`

### Documentation Updates
- [ ] **Code comments**: Complex logic should have clear comments
- [ ] **README updates**: Update if new features or setup requirements added
- [ ] **Error messages**: User-facing errors should be clear and helpful

## Deployment Readiness
- [ ] **Environment variables**: Server/.env configured with valid API key
- [ ] **Dependencies**: All npm packages installed and up to date
- [ ] **Build artifacts**: Clean dist/ folder after successful build
- [ ] **Configuration**: Vite and Express configs appropriate for target environment

## No Specific Testing Framework
This project currently uses manual testing rather than automated test suites. Future enhancements could include:
- Jest for unit testing
- React Testing Library for component testing  
- Cypress or Playwright for end-to-end testing