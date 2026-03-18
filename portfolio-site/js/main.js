/* Main JavaScript
   ================ */

document.addEventListener('DOMContentLoaded', function () {

  // ---- Navbar Scroll Effect ----
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  // ---- Mobile Menu Toggle ----
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      navLinks.classList.toggle('active');
      navToggle.classList.toggle('active');
    });
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('active');
        navToggle.classList.remove('active');
      });
    });
  }

  // ---- Scroll Animations (Intersection Observer) ----
  const animateElements = document.querySelectorAll('.animate-on-scroll');
  if (animateElements.length > 0) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    animateElements.forEach(function (el) {
      observer.observe(el);
    });
  }

  // ---- FAQ Accordion ----
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(function (item) {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', function () {
        const isActive = item.classList.contains('active');
        // Close all
        faqItems.forEach(function (i) { i.classList.remove('active'); });
        // Open clicked if was closed
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });

  // ---- Smooth Scroll for Anchor Links ----
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ---- Stagger animation delay for cards ----
  const cards = document.querySelectorAll('.projects-grid .card');
  cards.forEach(function (card, i) {
    card.style.transitionDelay = (i * 0.1) + 's';
  });

  // ---- Contact Form Handler ----
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const formData = new FormData(contactForm);
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;

      // ボタンをローディング状態に
      submitBtn.textContent = '送信中...';
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.7';

      // Vercel Functionsへ送信
      fetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          company: formData.get('company'),
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          interest: formData.get('interest'),
          message: formData.get('message')
        }),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      .then(function (response) {
        return response.json()
          .catch(function () { return {}; })
          .then(function (payload) {
            if (!response.ok) {
              var msg = (payload && (payload.error || payload.message)) ? (payload.error || payload.message) : ('HTTP ' + response.status);
              var details = payload && payload.details ? ('\n' + payload.details) : '';
              throw new Error(msg + details);
            }
            return payload;
          });
      })
      .then(function (data) {
        if (data.success) {
          // 送信成功
          contactForm.style.display = 'none';
          if (formSuccess) formSuccess.style.display = 'block';

          // PostHogイベント送信
          if (typeof posthog !== 'undefined') {
            var company = sessionStorage.getItem('portfolio_company') || 'direct';
            posthog.capture('contact_form_submitted', {
              company_name: formData.get('company'),
              interest: formData.get('interest'),
              visitor_company: company
            });
          }
        } else {
          var errMsg = (data && (data.error || data.message)) ? (data.error || data.message) : '送信エラー';
          throw new Error(errMsg);
        }
      })
      .catch(function (err) {
        var msg = err && err.message ? err.message : '送信に失敗しました。しばらくしてから再度お試しください。';
        alert(msg);
      })
      .finally(function () {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
      });
    });
  }

});
