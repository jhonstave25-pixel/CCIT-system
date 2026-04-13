# Performance Optimization Notes

## Top 5 Performance Bottlenecks Identified

1. **Framer Motion Heavy Usage**
   - Location: Landing page, dashboard, events, profile components
   - Impact: Large bundle size (~50KB), layout animations causing jank
   - Solution: Replace with CSS transitions, remove layout animations

2. **transition-all CSS Property**
   - Location: Throughout app (30+ instances)
   - Impact: Animates all properties, expensive repaints
   - Solution: Replace with targeted transitions (opacity, transform, colors)

3. **Large Data Tables Without Pagination**
   - Location: User table, directory tables
   - Impact: Rendering 100+ rows causes slow initial render
   - Solution: Add pagination (already exists in some, need to add to others)

4. **No Search Debouncing**
   - Location: Directory search, user search
   - Impact: API calls on every keystroke
   - Solution: Add 300ms debounce

5. **Heavy Backdrop Blur Effects**
   - Location: Sidebars, modals, cards
   - Impact: Expensive GPU operations
   - Solution: Reduce blur intensity or use solid backgrounds

## Additional Issues Found

- No database indexes on frequently filtered columns
- No memoization of heavy components
- Sidebar re-renders on every route change
- Long animation durations (400ms+) blocking interaction
- No dynamic imports for heavy admin components

## Performance Targets

- Route change: < 100ms
- Initial page load: < 2s
- INP (Interaction to Next Paint): < 200ms
- LCP (Largest Contentful Paint): < 2.5s

