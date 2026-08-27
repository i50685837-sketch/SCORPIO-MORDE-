const IntaSend = require("intasend-node");

const publishableKey =
    process.env.INTASEND_PUBLISHABLE_KEY;

const secretKey =
    process.env.INTASEND_SECRET_KEY;

const testMode =
    String(process.env.INTASEND_TEST).toLowerCase() === "true";

if (!publishableKey) {
    console.warn(
        "⚠️ INTASEND_PUBLISHABLE_KEY is missing"
    );
}

if (!secretKey) {
    console.warn(
        "⚠️ INTASEND_SECRET_KEY is missing"
    );
}

const intasend = new IntaSend(
    publishableKey,
    secretKey,
    testMode
);

const collection = intasend.collection();

/**
 * Send M-Pesa STK Push
 */
async function sendStkPush({
    amount,
    phone,
    apiRef,
    email = "customer@example.com",
    firstName = "Scorpio",
    lastName = "Customer",
    host
}) {

    if (!amount) {
        throw new Error("Amount is required");
    }

    if (!phone) {
        throw new Error("Phone number is required");
    }

    const response =
        await collection.mpesaStkPush({

            first_name: firstName,

            last_name: lastName,

            email: email,

            host:
                host ||
                process.env.BASE_URL ||
                "https://example.com",

            amount: Number(amount),

            phone_number: phone,

            api_ref: apiRef
        });

    return response;
}

module.exports = {
    sendStkPush
};
