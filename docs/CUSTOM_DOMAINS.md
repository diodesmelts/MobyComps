# Setting Up Custom Domains on Render

This guide explains how to configure a custom domain for your Prize Competition Platform deployed on Render.

## Prerequisites

1. A domain name registered with a domain registrar (e.g., GoDaddy, Namecheap, Google Domains)
2. Access to your domain's DNS settings
3. Your application successfully deployed on Render

## Steps to Add a Custom Domain

### 1. In the Render Dashboard

1. Sign in to your Render account
2. Navigate to your deployed web service
3. Click on the "Settings" tab
4. Scroll down to the "Custom Domains" section
5. Click "Add Custom Domain"
6. Enter your domain name (e.g., `yourapp.com` or `www.yourapp.com`)
7. Click "Save"

### 2. Verify Domain Ownership

Render will provide you with DNS records to add to your domain registrar:

#### Option 1: CNAME Record (Recommended)
- **Type**: CNAME
- **Name**: www (or subdomain)
- **Value**: The Render URL provided in the dashboard
- **TTL**: 3600 (or recommended value)

#### Option 2: A Records
- **Type**: A
- **Name**: @ (or subdomain)
- **Value**: IP addresses provided by Render
- **TTL**: 3600 (or recommended value)

### 3. Update DNS Records

1. Log in to your domain registrar account
2. Navigate to DNS management for your domain
3. Add the CNAME or A records provided by Render
4. Save the changes

### 4. Wait for DNS Propagation

DNS changes can take up to 48 hours to propagate worldwide, but typically complete within a few hours.

### 5. Verify SSL Setup

Render automatically provisions SSL certificates for custom domains using Let's Encrypt:

1. After DNS propagation, check your custom domain in a browser
2. Verify that the connection is secure (https)
3. If SSL isn't working after 24 hours, contact Render support

## Multiple Domains

If you want to use multiple domains or subdomains (e.g., both `yourapp.com` and `www.yourapp.com`):

1. Repeat the process for each domain/subdomain
2. For apex domain and www subdomain redirects:
   - Add both domains to Render
   - Set up proper DNS records for both
   - Use your domain registrar's redirect feature or a custom redirect solution

## Troubleshooting

If your custom domain isn't working:

1. **Verify DNS Setup**: Use tools like `dig` or `nslookup` to check your DNS records
2. **Check Domain Status**: Ensure your domain registration is active and not expired
3. **Verify SSL**: Use a tool like [SSL Checker](https://www.sslshopper.com/ssl-checker.html) to verify certificate 
4. **DNS Propagation**: Use a tool like [dnschecker.org](https://dnschecker.org) to check if your DNS has propagated
5. **Contact Support**: If everything seems correct but the domain still doesn't work, contact Render support