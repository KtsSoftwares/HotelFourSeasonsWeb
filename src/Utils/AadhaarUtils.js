/**
 * Utility to parse and verify offline Aadhaar XML in the browser.
 */

const computeSha256 = async (string) => {
    const utf8 = new TextEncoder().encode(string);
    const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const parseAadhaarXML = async (xmlString) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    
    const root = xmlDoc.getElementsByTagName("OfflinePaperlessKyc")[0];
    const uidData = xmlDoc.getElementsByTagName("UidData")[0];
    const poi = uidData.getElementsByTagName("Poi")[0];
    const poa = uidData.getElementsByTagName("Poa")[0];
    const pht = uidData.getElementsByTagName("Pht")[0]?.textContent;

    // Extract Basic Info
    const fullName = poi.getAttribute("name");
    const names = fullName.split(' ');
    
    return {
        firstName: names[0],
        lastName: names.slice(1).join(' '),
        dob: poi.getAttribute("dob"),
        gender: poi.getAttribute("gender"),
        photoBase64: pht,
        hashedPhoneNumber: poi.getAttribute("m"), // Store for later verification
        address: {
            careOf: poa.getAttribute("careof"),
            location: poa.getAttribute("loc"),
            vtc: poa.getAttribute("vtc"),
            subDistrict: poa.getAttribute("subdist"),
            district: poa.getAttribute("dist"),
            state: poa.getAttribute("state"),
            pincode: poa.getAttribute("pc"),
            country: poa.getAttribute("country"),
        }
    };
};

export const verifyMobile = async (mobile, shareCode, aadhaarLastDigit, hashedPhoneNumber) => {
    let currentHash = await computeSha256(mobile + shareCode);
    
    // Last digit of Aadhaar determines number of rounds (per your C# logic)
    const rounds = parseInt(aadhaarLastDigit);
    if (rounds > 0) {
        for (let i = 1; i < rounds; i++) {
            currentHash = await computeSha256(currentHash);
        }
    }
    
    return currentHash === hashedPhoneNumber;
};

export const base64ToFile = (base64String, fileName = "profile.jpg") => {
    try {
        const binaryString = atob(base64String);
        
        const length = binaryString.length;
        const bytes = new Uint8Array(length);
        
        // Convert binary string to a numeric byte array
        for (let i = 0; i < length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Create the file object. 
        // We manually set 'image/jpeg' because Aadhaar photos are JPEGs.
        return new File([bytes], fileName, { type: 'image/jpeg' });
    } catch (error) {
        console.error("Failed to convert Aadhaar photo string:", error);
        return null;
    }
};


// Debug utility to trigger a download of the file (for testing purposes)
// Don't use this in production, but it can help verify that the base64 conversion is working correctly.
export const debugDownloadFile = (file) => {
    // 1. Create a temporary URL for the file object
    const url = URL.createObjectURL(file);
    
    // 2. Create a hidden <a> tag
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name || "debug_photo.jpg";
    
    // 3. Trigger the click and clean up
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log("Debug download triggered for:", file.name);
};