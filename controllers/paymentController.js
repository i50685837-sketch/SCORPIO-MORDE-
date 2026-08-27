const { sendStkPush } = require("../services/intasend");

exports.stkPush = async (req, res) => {
    try {
        const { phone, amount } = req.body;

        if (!phone || !amount) {
            return res.status(400).json({
                success: false,
                message: "Phone number and amount are required"
            });
        }

        const user = req.user;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const result = await sendStkPush({
            firstName: user.firstName || user.name || "Scorpio",
            lastName: user.lastName || "Morde",
            email: user.email,
            phoneNumber: phone,
            amount: Number(amount),
            apiRef: `SCORPIO-${user._id}-${Date.now()}`
        });

        return res.status(200).json({
            success: true,
            message: "STK Push sent successfully",
            transactionId: result.transactionId,
            data: result.response
        });

    } catch (error) {
        console.error("STK ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "STK Push failed"
        });
    }
};
