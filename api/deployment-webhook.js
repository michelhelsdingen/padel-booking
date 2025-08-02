// Vercel Deployment Webhook Handler
// This receives notifications from Vercel when deployments complete

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { type, deployment, project } = req.body

    // Only handle successful deployments
    if (type === 'deployment.succeeded') {
      const deploymentInfo = {
        project: project.name,
        url: `https://${deployment.url}`,
        branch: deployment.meta?.githubCommitRef || 'main',
        commit: deployment.meta?.githubCommitSha?.substring(0, 7) || 'unknown',
        timestamp: new Date().toLocaleString('nl-NL')
      }

      // Option 1: Send email notification
      await sendEmailNotification(deploymentInfo)
      
      // Option 2: Send system notification (if running locally)
      // await sendSystemNotification(deploymentInfo)
      
      // Option 3: Send to Discord/Slack webhook
      // await sendDiscordNotification(deploymentInfo)
    }

    res.status(200).json({ message: 'Webhook processed' })
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).json({ message: 'Webhook processing failed' })
  }
}

async function sendEmailNotification(deployment) {
  // Using your existing email setup
  const nodemailer = require('nodemailer')
  
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: 'your-email@example.com', // Your email here
    subject: `✅ ${deployment.project} deployment successful`,
    html: `
      <h2>Deployment Successful! 🎉</h2>
      <p><strong>Project:</strong> ${deployment.project}</p>
      <p><strong>URL:</strong> <a href="${deployment.url}">${deployment.url}</a></p>
      <p><strong>Branch:</strong> ${deployment.branch}</p>
      <p><strong>Commit:</strong> ${deployment.commit}</p>
      <p><strong>Time:</strong> ${deployment.timestamp}</p>
    `
  })
}

async function sendDiscordNotification(deployment) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) return

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title: '✅ Deployment Successful',
        color: 0x00ff00,
        fields: [
          { name: 'Project', value: deployment.project, inline: true },
          { name: 'Branch', value: deployment.branch, inline: true },
          { name: 'Commit', value: deployment.commit, inline: true },
          { name: 'URL', value: `[Visit Site](${deployment.url})` }
        ],
        timestamp: new Date().toISOString()
      }]
    })
  })
}