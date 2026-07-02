// Securely submits email to Brevo and adds contact to Unconfirmed Subscribers list
// The Brevo API key is stored safely as a Netlify environment variable

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { email, firstName } = JSON.parse(event.body);

    if (!email) {
      return { statusCode: 400, body: JSON.stringify({ error: "Email is required" }) };
    }

    const brevoKey = process.env.BREVO_API_KEY;
    if (!brevoKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "Brevo API key not configured" }) };
    }

    // Add contact to Brevo — Unconfirmed Subscribers list ID 8
    const response = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoKey
      },
      body: JSON.stringify({
        email: email,
        attributes: {
          FIRSTNAME: firstName || ""
        },
        listIds: [8],          // Unconfirmed Subscribers
        updateEnabled: true    // Update if contact already exists
      })
    });

    // 201 = created, 204 = updated (both are success)
    if (response.status === 201 || response.status === 204) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: "Contact added successfully" })
      };
    }

    const data = await response.json();

    // Contact already in list is not an error
    if (data.code === "duplicate_parameter") {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: "Contact already exists" })
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: data.message || "Failed to add contact" })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
