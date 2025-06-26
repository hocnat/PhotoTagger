declare module 'country-list/data.json' {
  const value: { code: string; name: string }[];
  export default value;
}

declare module '*.png' {
  const value: any;
  export default value;
}