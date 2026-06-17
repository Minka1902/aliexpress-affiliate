# Deploying AffiLink on Oracle Cloud (Always Free)

This app is **Next.js 15 + Prisma/SQLite + iron-session**. SQLite is a file on disk, so it
needs a host with a **persistent filesystem** — which is exactly what an Oracle Cloud
*Always Free* VM gives you (a real Linux server, not serverless). Nothing about the database
has to change.

The `deploy/` folder has everything you need:

| File | Purpose |
|---|---|
| `deploy/oracle-setup.sh` | One-shot installer: Node, Caddy, build, DB seed, service, firewall |
| `deploy/affilink.service` | systemd unit that runs `next start` and restarts on failure |
| `deploy/Caddyfile.example` | Reverse proxy with automatic HTTPS |

---

## 1. Create the VM

1. Sign up at <https://cloud.oracle.com> (needs a card for identity verification — **not charged**
   on Always Free).
2. **Compute → Instances → Create Instance.**
   - **Image:** Ubuntu 22.04 or 24.04
   - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM) — bump to **2 OCPU / 12 GB RAM**, still free.
     If ARM capacity is unavailable in your region, retry later or use the AMD `E2.1.Micro`.
   - **SSH keys:** upload your public key (or let it generate one and download the private key).
3. Note the **public IP** once it's running.

> Tip: the A1 "out of capacity" error is common. Try a different Availability Domain or region,
> or retry every few hours.

## 2. (Optional but recommended) Point a domain at it

Create a DNS **A record** (and **AAAA** if you have IPv6) for e.g. `affilink.example.com` →
your VM's public IP. This lets Caddy get a free HTTPS certificate automatically. You can skip
this and run on plain HTTP via the IP for testing.

## 3. Open ports in the OCI console (Security List / NSG)

OCI blocks inbound traffic by default at **two** layers. First, the cloud firewall:

1. **Networking → Virtual Cloud Networks → your VCN → Subnet → Security List.**
2. Add **Ingress Rules** (Stateless = No, Source `0.0.0.0/0`):
   - TCP **80**
   - TCP **443**

The setup script handles the *second* layer (the VM's own `iptables`) for you.

## 4. SSH in and run the setup script

```bash
ssh ubuntu@<your-public-ip>

# Get the code (this branch, or main once merged)
git clone https://github.com/minka1902/aliexpress-affiliate.git
cd aliexpress-affiliate

# First run: creates the app user, copies .env.example -> .env, then stops.
sudo DOMAIN=affilink.example.com bash deploy/oracle-setup.sh
#   ^ omit DOMAIN=... to serve on plain HTTP port 80
```

On the **first run** the script stops after creating `/opt/affilink/.env`. Fill it in:

```bash
sudo -u affilink nano /opt/affilink/.env
```

Set at minimum (generate the random ones with `openssl rand -base64 32`):

- `DATABASE_URL` — already set to `file:/var/lib/affilink/app.db` (persistent)
- `SESSION_SECRET`, `ENCRYPTION_KEY` — 32+ char random strings
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — your admin login (seeded once)
- `ALIEXPRESS_APP_KEY`, `ALIEXPRESS_APP_SECRET` — from the AliExpress Open Platform
- SMTP / AI / Stripe keys as needed (see `.env.example` comments)

Then run it again — this builds, seeds the admin, and starts everything:

```bash
sudo DOMAIN=affilink.example.com bash deploy/oracle-setup.sh
```

## 5. Verify

```bash
systemctl status affilink     # the Next.js app (port 3000, behind Caddy)
systemctl status caddy        # reverse proxy + HTTPS
journalctl -u affilink -f     # live app logs
```

Visit `https://affilink.example.com` (or `http://<public-ip>` without a domain). Log in with
your `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

---

## Updating after you push new code

```bash
ssh ubuntu@<public-ip>
cd aliexpress-affiliate && git pull          # (or just re-run the script — it pulls for you)
sudo REPO_BRANCH=main bash deploy/oracle-setup.sh
```

The script is idempotent: it re-pulls, rebuilds, re-applies the Prisma schema, and restarts
the service. Your SQLite DB in `/var/lib/affilink/` is untouched.

## Backups

Your entire database is one file. Back it up with:

```bash
sudo cp /var/lib/affilink/app.db ~/app-backup-$(date +%F).db
```

## Troubleshooting

- **Site unreachable:** you almost certainly missed the **OCI Security List** ingress rules
  (step 3) — that's separate from the VM firewall the script opens.
- **HTTPS cert fails:** DNS isn't pointing at the VM yet, or port 443 is closed. Check
  `journalctl -u caddy -f`.
- **App won't start:** `journalctl -u affilink -e` — usually a missing/typo'd `.env` value.
- **ARM shape unavailable:** retry later or switch region / Availability Domain.
