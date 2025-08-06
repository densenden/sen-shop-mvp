// Admin branding override
document.addEventListener('DOMContentLoaded', function() {
  // Change title
  document.title = 'SenCommerce Admin';
  
  // Helper function to hide menu items by text
  function hideMenuItemByText(text) {
    const menuItems = document.querySelectorAll('nav a, [role="menuitem"], .sidebar a, .navigation a');
    menuItems.forEach(item => {
      if (item.textContent && item.textContent.trim() === text) {
        item.style.display = 'none';
        // Also hide parent list item if it exists
        const listItem = item.closest('li');
        if (listItem) {
          listItem.style.display = 'none';
        }
      }
    });
  }
  
  // Override Medusa branding
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      // Replace Medusa text with SenCommerce
      const textNodes = document.evaluate(
        '//text()[contains(., "Medusa")]',
        document,
        null,
        XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
        null
      );
      
      for (let i = 0; i < textNodes.snapshotLength; i++) {
        const node = textNodes.snapshotItem(i);
        if (node.nodeValue.includes('Medusa')) {
          node.nodeValue = node.nodeValue.replace(/Medusa/g, 'SenCommerce');
        }
      }
      
      // Replace logos
      const logos = document.querySelectorAll('img[alt*="Medusa"], svg');
      logos.forEach(logo => {
        if (logo.src && logo.src.includes('medusa')) {
          logo.src = '/logo.svg';
        }
      });
      
      // Hide specific core menu items if needed
      // Uncomment any of these to hide specific menu items:
      
      // hideMenuItemByText('Orders');
      // hideMenuItemByText('Customers'); 
      // hideMenuItemByText('Inventory');
      // hideMenuItemByText('Pricing');
      // hideMenuItemByText('Promotions');
      // hideMenuItemByText('Categories');
      // hideMenuItemByText('Collections');
      // hideMenuItemByText('Gift Cards');
      // hideMenuItemByText('Sales Channels');
      // hideMenuItemByText('Regions');
      // hideMenuItemByText('Settings');
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});