# 🚨 INCIDENT RESPONSE & RUNBOOK

**Project**: MultiCamPro v1.0.0  
**Document**: Production Incident Response Procedures

---

## Incident Response Overview

### Severity Levels

| Severity | Impact | Response Time | Escalation |
|----------|--------|----------------|------------|
| **P1 - Critical** | Complete service down, data loss risk | 1 minute | Immediate |
| **P2 - High** | Major feature broken, many users affected | 5 minutes | 2 minutes |
| **P3 - Medium** | Feature partially broken, some users affected | 15 minutes | 10 minutes |
| **P4 - Low** | Minor issue, minimal user impact | 1 hour | Not required |

---

## Critical Incidents (P1)

### P1.1: Complete Service Outage

**Symptoms**
- API returning 500 errors for all requests
- Users cannot login, upload, or download
- Error rate > 50% for > 5 minutes

**Initial Response (0-2 minutes)**

1. **Declare Incident**
   ```
   Announce in #incident-response channel:
   "INCIDENT DECLARED - P1: Complete Service Outage"
   - Time: [timestamp]
   - Affected Services: All
   - Status: Investigating
   ```

2. **Page On-Call Engineer**
   - Phone call to on-call primary
   - Activate war room Slack channel
   - Escalate to engineering lead

3. **Quick Verification**
   - Check Firebase status page
   - Check Google Cloud Console
   - Check backend server logs
   - Check database connection pool
   - Check recent deployments

**Diagnosis and Mitigation (2-10 minutes)**

```
DECISION TREE:
├── Backend not responding?
│   ├── Recent deployment? → ROLLBACK
│   ├── Database down? → Check Cloud Run → Restart → Restore from backup
│   ├── Out of memory? → Restart services → Increase resources
│   └── Rate limited? → Check API Gateway → Adjust limits
│
├── Firebase down?
│   ├── Check Firebase status
│   ├── Verify region availability
│   └── Wait for Google to resolve (provide status updates)
│
└── Network issue?
    ├── Check VPN connections
    ├── Check CDN health
    └── Restart load balancers
```

**Recovery Actions**

**Option 1: Rollback (if recent deployment)**
```bash
# Switch to previous stable build
gcloud app versions stop current-version
gcloud app versions start previous-version

# Or via CI/CD:
git revert HEAD
git push main
# Wait for automatic deployment of previous version
```

**Option 2: Restart Services**
```bash
# Restart Cloud Run
gcloud run services update multicampro-api --region=us-central1

# Or via Docker:
docker-compose restart backend
docker-compose restart database
```

**Option 3: Data Recovery**
```bash
# Restore from hourly backup if data corruption suspected
firebase firestore backups restore backup-2026-02-17-14:00:00
```

**Communication (Ongoing)**
- Update Slack status every 3 minutes
- Update status page (if external)
- Notify customers if expected > 15 minutes

**Post-Resolution**
- [ ] Verify all systems responding normally
- [ ] Check recent logs for errors
- [ ] Confirm users can perform basic operations
- [ ] Stand down incident war room
- [ ] Schedule post-mortem (within 24 hours)

---

### P1.2: Data Loss or Corruption

**Symptoms**
- Users reporting missing files
- Database queries returning incorrect data
- Firestore document counts don't match
- Cloud Storage file count mismatch

**Immediate Actions (0-5 minutes)**

1. **Stop the Bleeding**
   ```bash
   # Backup current state
   cp -r /data /data-corrupted-$(date +%s)
   
   # Enable maintenance mode (if possible)
   export APP_MAINTENANCE_MODE=true
   ```

2. **Assess Damage**
   - Query backup logs: `SELECT COUNT(*) FROM users`
   - Compare with Firestore: same count?
   - Check file sync status in Cloud Storage
   - Review audit logs for suspicious activity
   - Check for recent malicious queries

3. **Notify Leadership**
   ```
   "INCIDENT P1: Potential Data Corruption"
   - Last good backup: 2026-02-17 14:00 UTC
   - Affected records: ~[X] files
   - User impact: Potential file loss
   - Mitigation: Preparing restore
   ```

**Recovery Process (5-30 minutes)**

**Option 1: Restore from Hourly Backup**
```bash
# List available backups
gcloud firestore backups list

# Restore to specific version
gcloud firestore restore projects/[PROJECT-ID]/locations/us-central1/backups/[BACKUP-ID]

# Verify restore
gsutil ls gs://multicampro-prod.appspot.com/ | wc -l
```

**Option 2: Selective Recovery**
```typescript
// Only restore affected user data
const affectedUsers = ['user1', 'user2', 'user3'];

for (const userId of affectedUsers) {
  await db.collection('users').doc(userId)
    .set(backupData[userId], { merge: true });
}
```

**Communication**
```
Update: "Data corruption identified. Restoring from backup at 14:00 UTC.
Affected: ~[X] files. Recovery ETA: 30 minutes."
```

**Post-Recovery**
- [ ] Verify data integrity
- [ ] Confirm file counts match pre-incident
- [ ] Contact affected users with status
- [ ] Review what caused corruption
- [ ] Schedule deep audit

---

### P1.3: Security Breach

**Symptoms**
- Unauthorized access detected
- Credentials exposed
- Suspicious API activity
- Data exfiltration suspected

**Immediate Actions (0-2 minutes)**

1. **Isolate Affected Systems**
   ```bash
   # Revoke all API keys
   # Rotate Firebase credentials
   gcloud firebase apikeys delete [KEY-ID]
   
   # Disable suspicious user accounts
   # Stop deployments
   ```

2. **Gather Evidence**
   ```bash
   # Export recent logs (24 hours)
   gcloud logging read --limit 10000 > /secure/incident-logs.json
   
   # Export Firestore audit logs
   gcloud firestore operations list --limit 1000
   ```

3. **Activate Breach Protocol**
   - Notify Security Lead immediately
   - Start detailed logging of all access
   - Begin forensic investigation
   - Prepare user notification

**Remediation (2-30 minutes)**

```bash
# 1. Rotate all credentials
export NEW_DB_PASSWORD=$(openssl rand -base64 32)
update_database_credentials $NEW_DB_PASSWORD

# 2. Reset API keys
gcloud firebase apikeys create --api-target=ALL

# 3. Force re-authentication
UPDATE users SET last_verified = 0 WHERE status = 'active'

# 4. Enable enhanced logging
export LOG_LEVEL=debug
export SECURITY_AUDIT_LOG=true

# 5. Review permissions
# Check IAM roles: Are there unexpected admin accounts?
gcloud projects get-iam-policy multicampro-prod
```

**Communication**
- Contact affected users immediately
- Privacy/Legal team drafts statement
- Prepare notification email
- Document timeline

**Post-Incident**
- [ ] Third-party security audit
- [ ] Forensic report completed
- [ ] All credentials rotated
- [ ] User notifications sent
- [ ] Review and strengthen security

---

## High Priority Incidents (P2)

### P2.1: Upload/Download Feature Broken

**Symptoms**
- Upload failures for all users (error rate > 20%)
- Download timeouts or errors
- Storage quota errors even with available space
- Partial files being created

**Diagnosis (5 minutes)**

```bash
# Check Cloud Storage status
gsutil stat gs://multicampro-prod.appspot.com/

# Check Firebase Storage rules
firebase rules:list

# Check recent deployments
git log --oneline -10

# Check error logs
look for "storage", "upload", "download" in Firebase Logs
```

**Common Fixes**

**Issue: Storage Rules Are Too Restrictive**
```
Solution: 
1. Review rules in Firebase Console
2. Check SecurityRules in git
3. Deploy corrected rules:
   firebase deploy --only storage:rules
4. Test upload with test account
5. Verify in error logs (errors should decrease)
```

**Issue: Cloud Storage Quota Exceeded**
```
Solution:
1. Check quota: gcloud compute project-info describe --project=multicampro-prod
2. Request quota increase
3. Temporary: Clean old test files - gsutil -m rm gs://bucket/test/**
4. Monitor: Set up alerts for approaching quotas
```

**Issue: Recent Code Deployment Broke Upload**
```
Solution:
1. Identify problematic deployment: git log
2. Revert: git revert [COMMIT-HASH]
3. Test locally
4. Deploy fix or previous version
```

---

### P2.2: Authentication/Login Not Working

**Symptoms**
- Users cannot login (Firebase Auth returning errors)
- Session tokens invalid
- OAuth integration broken
- Email verification emails not sending

**Quick Fixes**

```bash
# Check Firebase Authentication status
firebase auth info

# Verify email service
# Check SendGrid/Email provider status

# Check recent changes to auth code
git diff HEAD~1 src/config/firebase.ts

# Restart authentication service
# Clear auth cache: Users may need to sign out/in

# Verify credentials
echo $FIREBASE_API_KEY
echo $FIREBASE_AUTH_DOMAIN
```

**Common Causes & Solutions**

| Issue | Solution |
|-------|----------|
| API Key rotated | Update `.env` with new key |
| Email service down | Check provider (SendGrid/AWS SES), enable backup |
| CORS blocked | Update Firebase Authorized Domains |
| Token expired | Wait for refresh or force re-auth |
| User account locked | Check Firebase Authentication security settings |

---

## Medium Priority Incidents (P3)

### P3.1: Slow Performance

**Symptoms**
- API responses > 2 seconds
- App startup slow > 5 seconds
- Database queries hanging
- UI unresponsive

**Investigation**

```bash
# Check CPU/Memory
gcloud compute instances describe multicampro-prod --zone=us-central1-a

# Check database performance
# Query analytics for slow queries
firebase performance console → Slow screens/requests

# Check network latency
ping api.multicampro.com  # Should be < 50ms
```

**Fixes**

1. **Scale up resources**
   ```bash
   gcloud run services update multicampro-api \
     --memory=2Gi --cpu=2
   ```

2. **Optimize database queries**
   ```typescript
   // Add indexes for slow queries
   // Use caching layer
   // Lazy load data
   ```

3. **Reduce payload size**
   ```bash
   # Check bundle size
   npm run build && npm run analyze
   
   # Enable compression
   gzip: enable in production
   ```

4. **Clear cache**
   ```bash
   redis-cli FLUSHDB
   ```

---

## Low Priority Incidents (P4)

### P4.1: Minor UI Issues

**Symptoms**
- Visual glitch affecting small group
- Non-critical feature broken
- Cosmetic issues
- One user affected

**Action**
- Log in issue tracker
- Schedule fix for next release
- No immediate action required
- Escalate if affects multiple users

---

## Incident Response Checklist

### During Incident
- [ ] Declare severity level
- [ ] Start war room (Slack channel)
- [ ] Page on-call engineer
- [ ] Begin status updates (every 3 minutes)
- [ ] Enable verbose logging
- [ ] Start collecting logs
- [ ] Prepare rollback plan

### While Troubleshooting
- [ ] Document every action taken
- [ ] Keep timeline of events
- [ ] Note any unusual behavior
- [ ] Take screenshots/captures
- [ ] Preserve evidence

### Resolution
- [ ] Verify fix is working
- [ ] Monitor for ~30 minutes post-fix
- [ ] Confirm with affected users (if applicable)
- [ ] Stand down incident
- [ ] Update status page

### Post-Incident
- [ ] Save all logs and evidence
- [ ] Schedule post-mortem within 24 hours
- [ ] Identify root cause
- [ ] Create action items
- [ ] Document learnings
- [ ] Update runbooks
- [ ] Train team if needed

---

## Escalation Matrix

```
Time    P1          P2          P3
──────────────────────────────────────
0-5m    Declare     Declare     Log
        Page all    Page 1 eng   Create ticket

5-15m   War room    War room    Assign engineer
        Executive   Alert lead  Update ETA

15-30m  CTO brief   Continue    Monitor
        Update      Update      Test fix
        every 3m    every 10m   

30m+    Executive   Escalate    Review
        update      to P1       in morning
```

---

## Contacts & On-Call

### On-Call Schedule
- **Primary**: [Engineer Name] - [Phone]
- **Secondary**: [Engineer Name] - [Phone]
- **Lead**: [Lead Name] - [Phone]

### Escalation
- **P1 after 10 min**: Page all engineers
- **P1 after 30 min**: Call CTO
- **P1 after 60 min**: Call CEO/Founder

### Communication Channels
- **Slack**: #incident-response
- **Status Page**: status.multicampro.com
- **Email**: [critical-incidents@multicampro.com]

---

## Post-Mortem Template

```markdown
## Incident Post-Mortem

**Incident**: [Title]
**Date**: [Date and Time - Duration]
**Severity**: P[1-4]

### Summary
[Brief description of what happened]

### Timeline
[HH:MM - Action/event]

### Root Cause
[What actually caused the issue]

### Impact
- Users affected: [X]
- Duration: [Y minutes]
- Data lost: [Yes/No]

### Resolution
[How it was fixed]

### Action Items
- [ ] [Fix TODO]
- [ ] [Monitor TODO]
- [ ] [Process TODO]

### Prevention
[How to prevent this in future]
```

---

**Last Updated**: February 17, 2026  
**Status**: ✅ Ready for Production
