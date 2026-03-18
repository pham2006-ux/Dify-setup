/* PostHog Analytics Integration
   ================================
   UTMパラメータから営業先を自動識別し、
   PostHogにユーザー属性として送信 */

(function () {
  // ---- PostHog初期化（公式スニペット） ----
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog && window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="fi init Ci Mi ft Fi Ai Ri capture calculateEventProperties Ui register register_once register_for_session unregister unregister_for_session qi getFeatureFlag getFeatureFlagPayload getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey displaySurvey cancelPendingSurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException startExceptionAutocapture stopExceptionAutocapture loadToolbar get_property getSessionProperty Hi ji createPersonProfile setInternalOrTestUser Bi Pi Vi opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing get_explicit_consent_status is_capturing clear_opt_in_out_capturing Di debug bt zi getPageViewId captureTraceFeedback captureTraceMetric Si".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

  // ---- PostHog設定 ----
  const POSTHOG_KEY = 'phc_HJK0xY1emyajaTfRtdNYPr26rXJ3l4rQ4n6O4Q4SF9U';
  const POSTHOG_HOST = '/ingest';

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    ui_host: 'https://us.posthog.com',
    person_profiles: 'always',
    capture_pageview: true,
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
  });

  // ---- UTMパラメータの解析 ----
  function getUTMParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
      utm_content: params.get('utm_content') || '',
      utm_term: params.get('utm_term') || '',
    };
  }

  // ---- 営業先の識別と属性設定 ----
  function identifyVisitor() {
    const utm = getUTMParams();

    // UTMパラメータがある場合（営業メールからの流入）
    if (utm.utm_campaign) {
      // 営業先の会社名をキーとして使用
      const companyName = utm.utm_campaign;

      // セッションストレージに保存（ページ遷移しても維持）
      sessionStorage.setItem('portfolio_company', companyName);
      sessionStorage.setItem('portfolio_utm', JSON.stringify(utm));

      if (typeof posthog !== 'undefined' && POSTHOG_KEY !== 'YOUR_POSTHOG_PROJECT_KEY') {
        // PostHogにユーザー属性を設定
        posthog.identify(companyName, {
          company: companyName,
          source: utm.utm_source,
          medium: utm.utm_medium,
          campaign: utm.utm_campaign,
          first_visit: new Date().toISOString(),
        });

        posthog.capture('email_link_clicked', {
          company: companyName,
          source: utm.utm_source,
        });
      }
    } else {
      // セッションストレージから復元（UTMなしの内部遷移）
      const saved = sessionStorage.getItem('portfolio_company');
      if (saved && typeof posthog !== 'undefined' && POSTHOG_KEY !== 'YOUR_POSTHOG_PROJECT_KEY') {
        posthog.identify(saved);
      }
    }
  }

  // ---- ページ滞在時間トラッキング ----
  function trackPageTime() {
    const startTime = Date.now();
    const pagePath = window.location.pathname;
    const company = sessionStorage.getItem('portfolio_company') || 'direct';

    window.addEventListener('beforeunload', function () {
      const duration = Math.round((Date.now() - startTime) / 1000);

      if (typeof posthog !== 'undefined' && POSTHOG_KEY !== 'YOUR_POSTHOG_PROJECT_KEY') {
        posthog.capture('page_time_spent', {
          page: pagePath,
          duration_seconds: duration,
          company: company,
        });
      }
    });
  }

  // ---- デモリンクのクリック追跡 ----
  function trackDemoClicks() {
    document.addEventListener('click', function (e) {
      const link = e.target.closest('a[href*="udify.app"]');
      if (link) {
        const company = sessionStorage.getItem('portfolio_company') || 'direct';

        if (typeof posthog !== 'undefined' && POSTHOG_KEY !== 'YOUR_POSTHOG_PROJECT_KEY') {
          posthog.capture('demo_link_clicked', {
            demo_url: link.href,
            page: window.location.pathname,
            company: company,
          });
        }
      }
    });
  }

  // ---- 初期化 ----
  document.addEventListener('DOMContentLoaded', function () {
    identifyVisitor();
    trackPageTime();
    trackDemoClicks();
  });
})();
