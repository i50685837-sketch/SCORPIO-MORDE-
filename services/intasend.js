const IntaSend = require("intasend-node");

const intasend = new IntaSend(
    process.env.INTASEND_PUBLISHABLE_KEY,
    process.env.INTASEND_SECRET_KEY,
    process.env.INTASEND_TEST_MODE === "true"
);

const collection = intasend.collection();

async function sendStkPush({
    firstName,
    lastName,
    email,
    phoneNumber,
    amount,
    apiRef
}) {
    if (!phoneNumber) {
        throw new Error("Phone number is required");
    }

    if (!amount || Number(amount) <= 0) {
        throw new Error("Invalid amount");
    }

    const response = await collection.mpesaStkPush({
        first_name: firstName || "Scorpio",
        last_name: lastName || "Morde",
        email: email || "customer@example.com",
        host: process.env.APP_URL || "https://scorpio-morde.onrender.com",
        amount: Number(amount),
        phone_number: phoneNumber,
        api_ref: apiRef || `SCORPIO-${Date.now()}`
    });

    // IMPORTANT:
    // Do not blindly use response.invoice.id
    const transactionId =
        response?.id ||
        response?.invoice?.id ||
        response?.tracking_id ||
        null;

    console.log("INTASEND STK RESPONSE:");
    console.log(JSON.stringify(response, null, 2));

    return {
        success: true,
        transactionId,
        response
    };
}

module.exports = {
    sendStkPush
};
