import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.9";
import { v4 as uuidv4 } from "npm:uuid@9.0.0";
import { createClient } from 'npm:@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

const BREVO_SMTP_KEY = Deno.env.get('BREVO_SMTP_KEY') || '6tfPWZFCKUavqjQ7';
const BREVO_SMTP_SERVER = 'smtp-relay.brevo.com';
const BREVO_SMTP_PORT = 587;
const BREVO_SMTP_LOGIN = '7dcdde001@smtp-brevo.com';
const SUPPORT_EMAIL = 'help@invisibl.co';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { subject, message, userEmail, businessName, category } = await req.json();

    // Validate input
    if (!subject || !message || !userEmail) {
      console.error('Missing required fields:', { subject: !!subject, message: !!message, userEmail: !!userEmail });
      throw new Error('Missing required fields');
    }

    // Validate email format
    if (!userEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      throw new Error('Invalid email address');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );

    // Generate ticket ID
    const ticketId = `INV-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Get user ID if the user is authenticated
    let userId = null;
    try {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (!userError && user) {
          userId = user.id;
        }
      }
    } catch (error) {
      console.error('Error getting user:', error);
    }

    // Store ticket in database
    const { data: ticketData, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        ticket_id: ticketId,
        user_id: userId,
        email: userEmail,
        business_name: businessName,
        category: category || 'general',
        subject,
        message,
        status: 'open'
      })
      .select()
      .single();

    if (ticketError) {
      console.error('Error storing ticket:', ticketError);
      throw new Error('Failed to store support ticket');
    }

    // Format the admin notification email
    const adminEmailContent = `
New Support Request (${ticketId})

From: ${businessName || 'N/A'}
Customer Email: ${userEmail}
Category: ${category || 'N/A'}

Subject: ${subject}

Message:
${message}
    `.trim();

    // Format the user confirmation email
    const userEmailContent = `
Dear ${businessName || 'Valued Customer'},

Thank you for contacting invisibl support. We have received your message and will get back to you within 24 hours.

Your ticket reference number is: ${ticketId}

Here's a copy of your message:

Subject: ${subject}
Category: ${category || 'N/A'}
Message:
${message}

If you need to add any additional information, you can reply directly to this email.

Best regards,
The invisibl Support Team
    `.trim();

    console.log('Initializing SMTP transport...');
    const transport = nodemailer.createTransport({
      host: BREVO_SMTP_SERVER,
      port: BREVO_SMTP_PORT,
      secure: false,
      auth: {
        user: BREVO_SMTP_LOGIN,
        pass: BREVO_SMTP_KEY
      },
      debug: true,
      logger: true
    });

    // Verify SMTP connection
    try {
      await transport.verify();
      console.log('SMTP connection verified successfully');
    } catch (error) {
      console.error('SMTP verification failed:', error);
      throw new Error('Failed to verify SMTP connection');
    }

    // Send notification to admin
    console.log('Sending admin notification...');
    const adminMailResult = await transport.sendMail({
      from: {
        name: 'Fashion Analytics Support',
        address: SUPPORT_EMAIL
      },
      to: SUPPORT_EMAIL,
      replyTo: userEmail,
      subject: `Support Request ${ticketId} from ${businessName || userEmail}: ${subject}`,
      text: adminEmailContent,
      references: `<${ticketId}@invisibl.co>`,
      messageId: `<${ticketId}@invisibl.co>`
    });

    console.log('Admin notification sent:', adminMailResult);

    // Send confirmation to user
    console.log('Sending user confirmation...');
    const userMailResult = await transport.sendMail({
      from: {
        name: 'invisibl Support',
        address: SUPPORT_EMAIL
      },
      to: userEmail,
      replyTo: SUPPORT_EMAIL,
      subject: `[${ticketId}] We've received your message - invisibl Support`,
      text: userEmailContent,
      references: `<${ticketId}@invisibl.co>`,
      inReplyTo: `<${ticketId}@invisibl.co>`
    });

    console.log('User confirmation sent:', userMailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        ticketId,
        message: `Your message has been sent successfully. Your ticket reference number is ${ticketId}. We will get back to you within 24 hours.`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in send-support-email function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred while sending the email',
        details: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});