export default {
  // SenCommerce branding configuration
  projectConfig: {
    name: "SenCommerce Admin",
    title: "SenCommerce - Artwork & POD Management"
  },
  admin: {
    path: "/app",
    // Override default styles
    customCss: `
      :root {
        --admin-brand-name: "SenCommerce";
      }
      
      /* Replace Medusa branding */
      [data-testid="logo"] {
        content: url('/logo.svg');
      }
      
      /* Update title references */
      title:contains("Medusa") {
        visibility: hidden;
      }
      
      title:contains("Medusa"):after {
        content: "SenCommerce Admin";
        visibility: visible;
      }
    `
  }
}