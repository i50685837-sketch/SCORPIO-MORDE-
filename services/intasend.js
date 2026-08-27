const axios = require("axios");

const BASE_URL =
    process.env.INTASEND_BASE_URL || "https://api.intasend.com";

const SECRET_KEY = process.env.INTASEND_SECRET_KEY;

if (!SECRET_KEY) {
    console.warn("⚠️ INTASEND_SECRET_KEY is missing");
}

const intasendAPI = axios.create({
    baseURL: BASE_URL,
    headers: {
        Authorization: `Bearer ${SECRET_KEY}`,
        "Content-Type": "application/json"
    },
    timeout: 30000
});

/* =========================================
   M-PESA STK PUSH
========================================= */

async function createSTKPush({
    phone,
    amount,
    reference,
    narrative
}) {
    if (!SECRET_KEY) {
        throw new Error("INTASEND_SECRET_KEY is not configured");
    }

    const response = await intasendAPI.post(
        "/api/v1/payment/collection/",
        {
            currency: "KES",
            amount: Number(amount),
            phone_number: phone,
            api_ref: reference,
            narrative:
                narrative || "SCORPIO MORDE wallet top-up"
        }
    );

    return response.data;
}

module.exports = {
    createSTKPush
};
