# AI Agent URL Tracking Guide

This guide explains how to use the `link-manager.html` tool to generate tracked URLs for outreach and marketing campaigns. This allows us to monitor the effectiveness of different channels and identify where our leads are coming from.

## What is `link-manager.html`?

It's a simple web page that generates a unique URL with specific tracking parameters (UTM parameters). When a potential client clicks on this URL, we can identify:
- Which company/person the link was for (`company`).
- The origin of the click, e.g., an email, a social media post (`source`).
- The type of campaign, e.g., direct outreach, paid ad (`medium`).

## How to Use the Tool

### 1. Start the Local Server

To use the `link-manager.html` page, you first need to run a local web server from the project's root directory.

Run the following command in your terminal:

```bash
python3 -m http.server 8000
```

This command starts a server. You can keep it running in the background.

### 2. Access the Tool

Once the server is running, open your web browser and go to the following address:

[http://localhost:8000/admin/link-manager.html](http://localhost:8000/admin/link-manager.html)

### 3. Generate a Tracking URL

On the page, you will see a form with the following fields:

-   **送信先の会社名/担当者名 (Company/Contact Name):** Enter the name of the company or the specific person you are sending the link to.
    -   *Example:* `株式会社テスト`
-   **流入元 (Source):** Enter the source from which the traffic will originate. This is a broad category.
    -   *Examples:* `email`, `social`, `website`
-   **媒体 (Medium):** Enter the specific medium of the link.
    -   *Examples:* `outreach` (for direct email), `post` (for a social media post), `cpc` (for a paid ad)

### 4. Copy and Use the URL

After filling out the form, click the **"URLを生成" (Generate URL)** button.

The generated URL with the tracking parameters will appear in the "生成されたURL" box. It will look something like this:

`https://your-portfolio-url.com/?utm_source=[source]&utm_medium=[medium]&utm_campaign=[company]`

Copy this URL and use it in your email, social media post, or ad campaign.

By following these steps, we can effectively track the performance of our client acquisition efforts and make data-driven decisions.
