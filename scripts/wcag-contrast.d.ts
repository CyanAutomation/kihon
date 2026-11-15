declare module 'wcag-contrast' {
  const contrast: {
    hex(foreground: string, background: string): number;
  };
  export default contrast;
}
