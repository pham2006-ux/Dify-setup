/* Main JavaScript — Redesigned */

document.addEventListener('DOMContentLoaded', function () {

  // ---- Navbar Scroll Effect ----
  var navbar = document.querySelector('.navbar');
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
  var navToggle = document.querySelector('.nav-toggle');
  var navLinks = document.querySelector('.nav-links');
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
  var animateElements = document.querySelectorAll('.animate-on-scroll');
  if (animateElements.length > 0) {
    var observer = new IntersectionObserver(
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
  var faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(function (item) {
    var question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', function () {
        var answer = item.querySelector('.faq-answer');
        var isActive = item.classList.contains('active');

        // Close all
        faqItems.forEach(function (i) {
          i.classList.remove('active');
          var a = i.querySelector('.faq-answer');
          if (a) a.style.maxHeight = null;
        });

        // Open clicked if was closed
        if (!isActive) {
          item.classList.add('active');
          if (answer) {
            answer.style.maxHeight = answer.scrollHeight + 'px';
          }
        }
      });
    }
  });

  // ---- Smooth Scroll for Anchor Links ----
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ---- Back to Top Button ----
  var backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 600) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    });
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ---- Contact Form Handler ----
  var contactForm = document.getElementById('contactForm');
  var formSuccess = document.getElementById('formSuccess');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var formData = new FormData(contactForm);
      var submitBtn = contactForm.querySelector('button[type="submit"]');
      var originalText = submitBtn.textContent;

      submitBtn.textContent = '送信中...';
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.7';

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
          contactForm.style.display = 'none';
          if (formSuccess) formSuccess.style.display = 'block';

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
