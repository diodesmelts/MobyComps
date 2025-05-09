// Empty toaster component that doesn't depend on anything else
// This helps us test that components can be imported correctly
export function Toaster() {
  return <div id="toaster" style={{ display: 'none' }} />;
}

export default Toaster;