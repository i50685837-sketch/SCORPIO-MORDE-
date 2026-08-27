const IntaSend = require('intasend-node');

const intasend = new IntaSend(
    process.env.INTASEND_PUBLISHABLE_KEY,
    process.env.INTASEND_SECRET_KEY,
    process.env.INTASEND_IS_TEST === 'true'
);

exports.initiateStkPush = async (req, res) => {
    try {
        const { phoneNumber, amount, email } = req.body;

        // Format phone number to 254XXXXXXXXX
        let formattedPhone = phoneNumber.replace(/[^0-9]/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '254' + formattedPhone.slice(1);
        }

        const collection = intasend.collection();
        const response = await collection.mpesaStkPush({
            first_name: 'Scorpio',
            last_name: 'Node',
            email: email,
            host: process.env.CALLBACK_URL,
            amount: amount,
            phone_number: formattedPhone,
            api_ref: `TOPUP_${Date.now()}`
        });

        return res.status(200).json({
            status: 'STK_DISPATCHED',
            message: 'PROMPT_SENT_TO_DEVICE',
            trackingId: response.invoice.invoice_id,
            details: response
        });
    } catch (err) {
        console.error('[INTASEND_ERROR]:', err);
        return res.status(400).json({
            status: 'STK_FAILED',
            message: err.message || 'PAYMENT_GATEWAY_REJECTED'
        });
    }
};

// Webhook / Callback Handler
exports.handleCallback = async (req, res) => {
    try {
        const payload = req.body;
        
        // Check IntaSend invoice status
        if (payload.state === 'COMPLETE') {
            console.log(`[PAYMENT_SUCCESS]: ${payload.invoice_id} | Amount: ${payload.value}`);
            // Logic to top up user balance/credits inside DB
        } else {
            console.warn(`[PAYMENT_STATE]: ${payload.state}`);
        }

        return res.status(200).json({ status: 'CALLBACK_PROCESSED' });
    } catch (err) {
        return res.status(500).json({ status: 'CALLBACK_ERROR', error: err.message });
    }
};
