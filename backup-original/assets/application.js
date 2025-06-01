/**
 * AttachmentNerd Base Theme JavaScript
 * Main application file
 */

// Theme namespace
window.AN = window.AN || {};

// Utility functions
AN.utils = {
  // Debounce function
  debounce: function(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Check if element is in viewport
  isInViewport: function(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  // Serialize form data
  serializeForm: function(form) {
    const formData = new FormData(form);
    const data = {};
    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }
    return data;
  }
};

// Mobile Menu
AN.mobileMenu = {
  init: function() {
    this.toggle = document.querySelector('[data-menu-toggle]');
    this.menu = document.querySelector('[data-mobile-menu]');
    this.overlay = document.querySelector('[data-menu-overlay]');
    this.closeBtn = document.querySelector('[data-menu-close]');
    this.submenuToggles = document.querySelectorAll('[data-submenu-toggle]');
    
    if (!this.toggle || !this.menu) return;
    
    this.bindEvents();
  },
  
  bindEvents: function() {
    this.toggle.addEventListener('click', () => this.openMenu());
    this.closeBtn?.addEventListener('click', () => this.closeMenu());
    this.overlay?.addEventListener('click', () => this.closeMenu());
    
    // Submenu toggles
    this.submenuToggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => this.toggleSubmenu(e));
    });
    
    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.closeMenu();
      }
    });
  },
  
  openMenu: function() {
    this.menu.classList.add('is-open');
    document.body.classList.add('menu-open');
  },
  
  closeMenu: function() {
    this.menu.classList.remove('is-open');
    document.body.classList.remove('menu-open');
  },
  
  toggleSubmenu: function(e) {
    const toggle = e.currentTarget;
    const submenu = toggle.nextElementSibling;
    
    toggle.classList.toggle('is-expanded');
    submenu?.classList.toggle('is-open');
  },
  
  isOpen: function() {
    return this.menu.classList.contains('is-open');
  }
};

// Search Overlay
AN.searchOverlay = {
  init: function() {
    this.triggers = document.querySelectorAll('[data-search-toggle]');
    this.overlay = document.querySelector('[data-search-overlay]');
    this.closeBtn = document.querySelector('[data-search-close]');
    this.input = this.overlay?.querySelector('input[type="search"]');
    
    if (!this.triggers.length || !this.overlay) return;
    
    this.bindEvents();
  },
  
  bindEvents: function() {
    this.triggers.forEach(trigger => {
      trigger.addEventListener('click', () => this.open());
    });
    
    this.closeBtn?.addEventListener('click', () => this.close());
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });
  },
  
  open: function() {
    this.overlay.classList.add('is-open');
    document.body.classList.add('search-open');
    setTimeout(() => this.input?.focus(), 100);
  },
  
  close: function() {
    this.overlay.classList.remove('is-open');
    document.body.classList.remove('search-open');
  },
  
  isOpen: function() {
    return this.overlay.classList.contains('is-open');
  }
};

// Sticky Header
AN.stickyHeader = {
  init: function() {
    this.header = document.querySelector('.site-header');
    if (!this.header || !this.header.parentElement.classList.contains('sticky-header-enabled')) return;
    
    this.headerHeight = this.header.offsetHeight;
    this.lastScrollTop = 0;
    this.scrollThreshold = 100;
    
    this.bindEvents();
  },
  
  bindEvents: function() {
    let ticking = false;
    
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    });
  },
  
  handleScroll: function() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Add/remove sticky class
    if (scrollTop > this.scrollThreshold) {
      this.header.classList.add('is-sticky');
      
      // Hide/show on scroll direction
      if (scrollTop > this.lastScrollTop && scrollTop > this.headerHeight * 2) {
        this.header.classList.add('is-hidden');
      } else {
        this.header.classList.remove('is-hidden');
      }
    } else {
      this.header.classList.remove('is-sticky', 'is-hidden');
    }
    
    this.lastScrollTop = scrollTop;
  }
};

// Product Sliders
AN.productSlider = {
  init: function() {
    const sliders = document.querySelectorAll('[data-products-slider]');
    
    sliders.forEach(slider => {
      this.initSlider(slider);
    });
  },
  
  initSlider: function(slider) {
    const track = slider.querySelector('.products-track');
    const prevBtn = slider.querySelector('[data-slider-prev]');
    const nextBtn = slider.querySelector('[data-slider-next]');
    
    if (!track) return;
    
    let currentIndex = 0;
    const slides = track.children;
    const slidesPerView = this.getSlidesPerView();
    const maxIndex = Math.max(0, slides.length - slidesPerView);
    
    // Update buttons
    const updateButtons = () => {
      prevBtn?.classList.toggle('is-disabled', currentIndex === 0);
      nextBtn?.classList.toggle('is-disabled', currentIndex >= maxIndex);
    };
    
    // Slide function
    const slideTo = (index) => {
      currentIndex = Math.max(0, Math.min(index, maxIndex));
      const offset = currentIndex * (100 / slidesPerView);
      track.style.transform = `translateX(-${offset}%)`;
      updateButtons();
    };
    
    // Bind events
    prevBtn?.addEventListener('click', () => slideTo(currentIndex - 1));
    nextBtn?.addEventListener('click', () => slideTo(currentIndex + 1));
    
    // Handle resize
    window.addEventListener('resize', AN.utils.debounce(() => {
      const newSlidesPerView = this.getSlidesPerView();
      if (newSlidesPerView !== slidesPerView) {
        location.reload(); // Simple solution for demo
      }
    }, 300));
    
    updateButtons();
  },
  
  getSlidesPerView: function() {
    const width = window.innerWidth;
    if (width >= 1024) return 4;
    if (width >= 768) return 3;
    if (width >= 640) return 2;
    return 1;
  }
};

// AJAX Cart
AN.ajaxCart = {
  init: function() {
    this.bindEvents();
  },
  
  bindEvents: function() {
    // Add to cart forms
    document.addEventListener('submit', (e) => {
      const form = e.target;
      if (form.action && form.action.includes('/cart/add')) {
        e.preventDefault();
        this.addToCart(form);
      }
    });
    
    // Quantity selectors
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-action="decrease"], [data-action="increase"]')) {
        this.updateQuantity(e.target);
      }
    });
  },
  
  addToCart: function(form) {
    const formData = new FormData(form);
    const button = form.querySelector('[type="submit"]');
    const originalText = button?.textContent;
    
    if (button) {
      button.disabled = true;
      button.textContent = 'Adding...';
    }
    
    fetch('/cart/add.js', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      this.updateCartCount();
      this.showNotification('Product added to cart');
      
      if (button) {
        button.textContent = 'Added!';
        setTimeout(() => {
          button.disabled = false;
          button.textContent = originalText;
        }, 2000);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      if (button) {
        button.disabled = false;
        button.textContent = originalText;
      }
    });
  },
  
  updateQuantity: function(button) {
    const input = button.parentElement.querySelector('input[type="number"]');
    if (!input) return;
    
    const currentValue = parseInt(input.value) || 0;
    const action = button.dataset.action;
    
    if (action === 'decrease' && currentValue > 0) {
      input.value = currentValue - 1;
    } else if (action === 'increase') {
      input.value = currentValue + 1;
    }
    
    // Trigger change event
    input.dispatchEvent(new Event('change'));
  },
  
  updateCartCount: function() {
    fetch('/cart.js')
    .then(response => response.json())
    .then(cart => {
      const counts = document.querySelectorAll('.cart-count');
      counts.forEach(count => {
        count.textContent = cart.item_count;
        if (cart.item_count > 0) {
          count.style.display = 'inline-flex';
        } else {
          count.style.display = 'none';
        }
      });
    });
  },
  
  showNotification: function(message) {
    // Simple notification - could be enhanced
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('is-visible');
    }, 10);
    
    setTimeout(() => {
      notification.classList.remove('is-visible');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
};

// Tab Panels (for auth forms)
AN.tabPanels = {
  init: function() {
    const tabContainers = document.querySelectorAll('.auth-tabs');
    
    tabContainers.forEach(container => {
      const tabs = container.querySelectorAll('[data-tab]');
      const panels = container.parentElement.querySelectorAll('[data-panel]');
      
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const targetPanel = tab.dataset.tab;
          
          // Update tabs
          tabs.forEach(t => t.classList.remove('is-active'));
          tab.classList.add('is-active');
          
          // Update panels
          panels.forEach(panel => {
            if (panel.dataset.panel === targetPanel) {
              panel.classList.add('is-active');
            } else {
              panel.classList.remove('is-active');
            }
          });
        });
      });
    });
  }
};

// Social Share
AN.socialShare = {
  init: function() {
    const copyButtons = document.querySelectorAll('[data-copy-link]');
    
    copyButtons.forEach(button => {
      button.addEventListener('click', () => {
        const link = button.dataset.copyLink;
        this.copyToClipboard(link, button);
      });
    });
  },
  
  copyToClipboard: function(text, button) {
    navigator.clipboard.writeText(text).then(() => {
      const tooltip = button.querySelector('.tooltip');
      if (tooltip) {
        tooltip.classList.add('is-visible');
        setTimeout(() => tooltip.classList.remove('is-visible'), 2000);
      }
    });
  }
};

// Lazy Loading
AN.lazyLoad = {
  init: function() {
    if ('IntersectionObserver' in window) {
      const images = document.querySelectorAll('img[loading="lazy"]');
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src || img.src;
            img.classList.add('is-loaded');
            imageObserver.unobserve(img);
          }
        });
      });
      
      images.forEach(img => imageObserver.observe(img));
    }
  }
};

// Newsletter Forms
AN.newsletter = {
  init: function() {
    const forms = document.querySelectorAll('[data-newsletter-form]');
    
    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitForm(form);
      });
    });
  },
  
  submitForm: function(form) {
    const email = form.querySelector('input[type="email"]').value;
    const button = form.querySelector('button[type="submit"]');
    const originalText = button?.textContent;
    
    if (button) {
      button.disabled = true;
      button.textContent = 'Subscribing...';
    }
    
    // Simulate API call
    setTimeout(() => {
      form.innerHTML = '<div class="form-success">Thanks for subscribing!</div>';
    }, 1000);
  }
};

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  AN.mobileMenu.init();
  AN.searchOverlay.init();
  AN.stickyHeader.init();
  AN.productSlider.init();
  AN.ajaxCart.init();
  AN.tabPanels.init();
  AN.socialShare.init();
  AN.lazyLoad.init();
  AN.newsletter.init();
});

// Initialize AJAX cart count on load
window.addEventListener('load', function() {
  AN.ajaxCart.updateCartCount();
});