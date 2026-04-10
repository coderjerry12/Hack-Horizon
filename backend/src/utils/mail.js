import Mailgen from "mailgen";
import nodemailer from "nodemailer"

const sendEmail = async(options)=>{
    const mailGenerator = new Mailgen({
        theme:"default",
        product:{
            name:"Task Manager",
            link:"https://taskmanagelink.com"
        }
    })
    
    const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent)
    const emailHtml = mailGenerator.generate(options.mailgenContent)

    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_SMTP_HOST,
        port: process.env.MAILTRAP_SMTP_PORT,
        secure: true, // port 465 requires SSL
        auth: {
            user: process.env.MAILTRAP_SMTP_USER,
            pass: process.env.MAILTRAP_SMTP_PASS
        }
    })

    const mail = {
        from: `"Task Manager" <${process.env.MAILTRAP_SMTP_USER}>`,
        to:options.email,
        subject:options.subject,
        text:emailTextual,
        html:emailHtml
    }

    try{
        await transporter.sendMail(mail)
        console.log("Email sent successfully")
    }catch(error){
        console.error("Email service failed silently. Make sure to check the email configuration and credentials in .env.")
        console.log("Error:", error)
    }
}

const emailVerificationMailgenContent = (username,verificationUrl)=>{
    return {
        body:{
            name:username,
            intro:"Welcome to our App! We are excited to have you on board.",
            action:{
                instruction:"To verify your email please click on the following button",
                button:{
                    color:"#22BC66",
                    text:"Confirm your account",
                    link:verificationUrl
                },
            },
            outro:"Need help, or have questions? Just reply to this email, we'd love to help."
        }
    }
}

const forgotPasswordMailgenContent = (username,passwordResetUrl)=>{
    return {
        body:{
            name:username,
            intro:"You have requested to reset your password. Please click the button below to proceed.",
            action:{
                instruction:"To reset your password please click on the following button",
                button:{
                    color:"#3077a4",
                    text:"Reset your password",
                    link:passwordResetUrl
                },
            },
            outro:"Need help, or have questions? Just reply to this email, we'd love to help."
        }
    }
}

const sosEmergencyAlertMailgenContent = (patientName, emergencyDetails, hospitalInfo, eta) => {
    return {
        body: {
            name: emergencyDetails.emergencyContactName,
            intro: `⚠️ URGENT: Medical Emergency Alert for ${patientName}`,
            table: {
                data: [
                    {
                        item: "Patient Name",
                        description: patientName
                    },
                    {
                        item: "Blood Group",
                        description: emergencyDetails.bloodGroup || "Not specified"
                    },
                    {
                        item: "Medical Conditions",
                        description: emergencyDetails.medicalConditions || "Not specified"
                    },
                    {
                        item: "Current Location",
                        description: `Lat: ${emergencyDetails.lat.toFixed(4)}, Lng: ${emergencyDetails.lng.toFixed(4)}`
                    },
                    {
                        item: "Assigned Hospital",
                        description: hospitalInfo.name
                    },
                    {
                        item: "Hospital Address",
                        description: hospitalInfo.address || "Address unavailable"
                    },
                    {
                        item: "Hospital Phone",
                        description: hospitalInfo.phone || "Not available"
                    },
                    {
                        item: "Estimated Travel Time",
                        description: `${eta.travelTimeInMinutes} minutes (${eta.distance} km)`
                    }
                ]
            },
            outro: "Emergency services have been alerted. Please keep this contact informed and ensure the patient receives immediate medical attention."
        }
    }
}

export {sendEmail, emailVerificationMailgenContent, forgotPasswordMailgenContent, sosEmergencyAlertMailgenContent}