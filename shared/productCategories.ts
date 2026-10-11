export const defaultProductCategories = [
  "Development boards",
  "Boards",
  "Sensors",
  "Displays",
  "Communication",
  "Robotics",
  "Power",
  "LEDs",
  "Components",
  "Prototyping",
  "Wiring",
  "Accessories",
  "Modules",
] as const;

export function categoriesForCatalog(names: string[]) {
  const uniqueNames = Array.from(new Set(names.filter(Boolean)));
  const defaultNames = defaultProductCategories.filter((name) => uniqueNames.includes(name));
  const customNames = uniqueNames
    .filter((name) => !defaultProductCategories.includes(name as typeof defaultProductCategories[number]))
    .sort((a, b) => a.localeCompare(b));
  return ["All", ...defaultNames, ...customNames];
}
