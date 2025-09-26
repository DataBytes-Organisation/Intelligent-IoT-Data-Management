

---


# 📊 Sensor Dashboard – Developer Guide

Welcome to the Sensor Dashboard! This project visualizes time-series data from multiple sensor streams. Whether you're contributing as part of a team or extending it as a personal project, this guide will help you build clean, modular, and scalable components.

---

## 🧱 Project Philosophy

We follow a **modular, component-driven architecture** using React. Every piece of UI should be:

- 🔄 Reusable  
- 🧩 Isolated  
- 🧪 Easy to test and debug  
- 🎨 Consistent in style and structure  

---

## 📁 Folder Structure

```
src/
├── components/         # Reusable UI components (charts, cards, selectors)
├── layouts/            # Page layouts (e.g., DashboardLayout)
├── pages/              # Top-level views (e.g., Dashboard.jsx)
├── utils/              # Helper functions (e.g., trendline, filtering)
├── hooks/              # Custom React hooks
├── styles/             # Global styles or Tailwind config

```
---

## 🧩 Component Guidelines

### ✅ Do:
- Keep components **focused**: one responsibility per file.
- Use **props** to make components flexible.
- Use **`children`** for layout wrappers like `DashboardLayout`.
- Write **clear conditional logic** for rendering based on state.
- Use **Tailwind or MUI consistently**—not both unless scoped and documented.
- Add **comments** explaining non-obvious logic.
- Use `console.log` **sparingly** and remove before committing.

### ❌ Don’t:
- Mix layout and logic in the same file.
- Hardcode stream names or data keys.
- Nest too many components in one file.
- Leave unused imports or variables.
- Add styles inline unless absolutely necessary.

---

## 🧠 State & Logic Best Practices

- Centralize shared state in parent components or context.
- Use custom hooks for reusable logic (e.g., `useFilteredData`).
- Validate props and handle edge cases (e.g., empty arrays).
- Use descriptive variable names (`selectedStreams`, `filteredData`, `MostCorrelatedPair`).

---

## 📊 Charting & Visualization

- Use `ScatterPlot`, `LineChart`, `Trendline` as modular blocks.
- Always pass in `data`, `selectedPair`, and `title` as props.
- Keep chart logic (e.g., trendline calculation) in `utils/`.

---

## 🧪 Testing & Debugging

- Use `console.log("Selected streams:", selectedStreams)` to trace logic.
- Comment your intent: `// Show correlation block if two streams selected`
- Break down large components into smaller ones for easier testing.

---

## 🧭 Adding a New Component

1. Create a new file in `src/components/`
2. Use functional components with clear props
3. Add Tailwind classes or MUI styles consistently
4. Test with mock data before integrating
5. Document usage in this README or a separate `docs/` folder

---

## 🤝 Team Collaboration

- Stick to the agreed design system (Tailwind or MUI)
- Use consistent naming conventions (`PascalCase` for components)
- Keep commits clean and descriptive
- Ask before introducing new libraries or patterns

---

## 📌 Example Component Template

```jsx
const StatsCard = ({ stream, data }) => {
  const stats = calculateStats(data, stream);
  return (
    <div className="bg-white p-4 rounded shadow">
      <h4 className="text-lg font-semibold">{stream}</h4>
      <p>Mean: {stats.mean}</p>
      <p>Variance: {stats.variance}</p>
    </div>
  );
};
```

---

## 🛠 Tools & Libraries

- React
- Tailwind CSS or MUI (choose one)
- Recharts (for charts)
- Vite (for dev server)
- ESLint + Prettier (for formatting)

---

## 🙌 Final Thoughts

This dashboard is meant to grow—but only if we keep it clean, modular, and intentional. Build components that are easy to read, easy to reuse, and easy to debug.

Let’s keep it scalable, maintainable, and developer-friendly.

---




