import { useRef, useState, useEffect, createContext, useContext, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth, updateProfile, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserSessionPersistence, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, doc, getDoc, getDocs, setDoc, serverTimestamp, collection, query, onSnapshot, deleteDoc, runTransaction, Timestamp, startAt, endAt, orderBy, where, startAfter, limit, documentId } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, listAll } from "firebase/storage";
import { FirebaseContextValue } from "../Models/Types";
import { Staff } from "../Models/Staff";
import { Room } from "../Models/Room";
import { Customer } from "../Models/Customer";
import { HotelData } from "../Models/HotelData";
import { KtsLegacy } from "../Models/KtsLegacy";
import { GstData } from "../Models/GstData";
import { Bill } from "../Models/Bill";

/**
 * @typedef {Object} CustomerReturn
    * @property {Customer[]} data
    * @property {boolean} fromCache
*/

/**
 * @typedef {Object} IFirebaseContext
 * @property {Staff | null} staffDetails
 * @property {Room[]} rooms
 * @property {Customer[]} customers
 * @property {Customer} lastDoc
 * @property {HotelData} hotelData
 * @property {KtsLegacy} legacyData
 * @property {GstData} gstData
 * @property {{ month: number, year: number, reports: Bill[] }} reportData
 * @property {function(string): string} getPreDocumentId
 * @property {function(string, string): Promise<void>} loginWithEmail
 * @property {function(): Promise<Staff|null>} getStaffData
 * @property {function(object, boolean): Promise<void>} updateStaffProfile
 * @property {function(string|null, string, File): Promise<string>} uploadOrReplaceFile
 * @property {function(boolean): Promise<void>} getRooms
 * @property {function(object): Promise<boolean>} saveRoom
 * @property {function(string): Promise<boolean>} deleteStorageFolder
 * @property {function(string): Promise<boolean>} deleteRoom
 * @property {function(string, object, boolean): Promise<void>} saveCustomer
 * @property {function(string[]): Promise<Customer[]>} getCompanions
 * @property {function(Array, string): Promise<void>} checkInTransaction
 * @property {function(string[], string, {companyName: string, companyAddress: {district: string, state: string, country: string}, companyGst: string}): Promise<void>} checkOutTransaction
 * @property {function(Customer): Promise<{bill: Bill, hotelData: HotelData}>} getOrSetBill
 * @property {function(Object, Customer, number, boolean): Promise<CustomerReturn>} getCustomersWithFilters
 * @property {function(string): Promise<Customer[]>} searchCustomersForEntry
 * @property {function(number, number): Promise<void>} fetchReport
 * @property {function(): Promise<void>} logout
 * @property {function(): Promise<void>} getLegacyAndHotelDataAndGstData
 * @property {function(string): Promise<void>} resetPassword
*/

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

/** @type {React.Context<IFirebaseContext>} */
const FbContext = createContext(null);
const appFirebase = initializeApp(firebaseConfig);
const auth = getAuth(appFirebase);
const db = getFirestore(appFirebase, import.meta.env.VITE_FIRESTORE_URL);
const storage = getStorage(appFirebase, import.meta.env.VITE_FIREBASE_STORAGE_URL);

// App Check Initialization with ReCAPTCHA v3
// Site won't run in localhost, we first host it and AppCheck will do its work.
if (typeof window !== "undefined") {
    initializeAppCheck(appFirebase, {
        provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY),
        // Isomorphic token auto-refreshment
        isTokenAutoRefreshEnabled: true 
    });
}

export const useFirebase = () => useContext(FbContext);

export const FirebaseProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    /** @type {[Room[], React.Dispatch<React.SetStateAction<Room[]>>]} */
    const [rooms, setRooms] = useState([]);
    /** @type {[Staff | null, React.Dispatch<React.SetStateAction<Staff | null>>]} */
    const [staffDetails, setStaffDetails] = useState(null);
    const [alert, setAlert] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasFetchedRooms, setHasFetchedRooms] = useState(false);
    /** @type {[KtsLegacy | null, React.Dispatch<React.SetStateAction<KtsLegacy | null>>]} */
    const [legacyData, setLegacyData] = useState(null);
    /** @type {[HotelData | null, React.Dispatch<React.SetStateAction<HotelData | null>>]} */
    const [hotelData, setHotelData] = useState(null);

    // For customer list
    /** @type {[Customer[], React.Dispatch<React.SetStateAction<Customer[]>>]} */
    const [customers, setCustomers] = useState([]);
    /** @type {[Customer | null, React.Dispatch<React.SetStateAction<Customer | null>>]} */
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState({ type: "name", value: "" });

    // Gst
    /** @type {[GstData, React.Dispatch<React.SetStateAction<GstData>>]} */
    const [gstData, setGstData] = useState(new GstData({ cgst: 0, sgst: 0, igst: 0 }));

    /** @type {[{ month: number, year: number, reports: Bill[] }, React.Dispatch<React.SetStateAction<{ month: number, year: number, reports: Bill[] }>>]} */
    const [reportData, setReportData] = useState({});

    const fetchingRef = useRef(false);

    /**
     * Observer: Manages User and resets Staff State on logout
     * @returns {void}
     */
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);

            // SECURITY: If no user, immediately wipe staff state
            if (!currentUser) {
                setStaffDetails(null);
            }

            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    /**
     * Observer: Real-time listener for rooms collection to keep dashboard and Customer page in sync with Firestore changes
     * @returns {void}
     */
    useEffect(() => {
        getLegacyAndHotelDataAndGstData(); // Fetch legacy and hotel data on app load for Customer Page

        const q = query(collection(db, "rooms"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const roomsList = querySnapshot.docs.map(doc => new Room(doc.id, doc.data()));
            setRooms(roomsList);
            setLoading(false);
        }, (error) => {
            console.error("Listener Error:", error);
            setLoading(false);
            setAlert({ msg: "Real-time update failed. Please refresh.", type: "danger" });
        });

        return () => unsubscribe();
    }, []);

    /**
     * Generates a unique Firestore ID for a specific collection without writing to the database.
     * @param {string} collectionName - The name of the collection (e.g., 'guests', 'rooms').
     * @returns {string} - A cryptographically strong unique ID.
     */
    const getPreDocumentId = (collectionName) => {
        // collection(db, collectionName) creates the reference path
        // doc(...) without an ID argument generates the unique ID locally
        const docRef = doc(collection(db, collectionName));
        return docRef.id;
    };

    /**
     * Logs in a user with email and password.
     * @param {string} email - The user's email.
     * @param {string} password - The user's password.
     * @returns {Promise<void>} - A promise resolving when the login is complete.
     */
    const loginWithEmail = async (email, password) => {
        setAlert(null);
        setLoading(true);
        try {
            await setPersistence(auth, browserSessionPersistence);
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            let friendlyMessage = "Login failed. Please check your credentials.";
            if (error.code === 'auth/wrong-password') friendlyMessage = "Incorrect password.";
            else if (error.code === 'auth/user-not-found') friendlyMessage = "No account found with this email.";
            setAlert({ msg: friendlyMessage, type: "danger" });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetches data only if state is empty or belongs to a different user
     * @returns {Promise<object|null>} - A promise resolving to the staff data or null.
     */
    const getStaffData = useCallback(async () => {
        if (!user?.uid) return null;

        // In-memory cache check
        if (staffDetails && staffDetails.uid === user.uid) {
            return staffDetails;
        }

        if (fetchingRef.current) return;
        fetchingRef.current = true;

        try {
            const docRef = doc(db, "staff", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = new Staff(user.uid, docSnap.data());

                setStaffDetails(data);
            } else {
                setStaffDetails(null);
            }
        } catch (error) {
            console.error("Firestore Fetch Error:", error);
        } finally {
            fetchingRef.current = false;
        }
    }, [user?.uid, staffDetails]);

    /**
     * Updates or Adds staff profile in Firestore and optionally updates Firebase Auth displayName if firstName is changed
     * @param {object} updatedData - The updated data for the staff member.
     * @param {boolean} isNewUser - Whether this is a new user.
     * @returns {Promise<void>} - A promise resolving when the update is complete.
     */
    const updateStaffProfile = async (updatedData, isNewUser) => {
        setLoading(true);
        try {
            const staffRef = doc(db, "staff", user.uid);
            const finalData = {
                ...updatedData,
                lastUpdatedAt: serverTimestamp()
            };

            if (isNewUser) {
                finalData.isAdmin = false;
                finalData.hasAccess = true;
                finalData.resigned = false;
                finalData.createdAt = serverTimestamp();
            }

            await setDoc(staffRef, finalData, { merge: true });

            if (updatedData.firstName && updatedData.firstName !== auth.currentUser.displayName) {
                await updateProfile(auth.currentUser, { displayName: updatedData.firstName });
            }

            // Refresh state after update
            setUser({ ...auth.currentUser });

            setStaffDetails(new Staff(user.uid, finalData));

            setAlert({ msg: isNewUser ? "Profile created!" : "Profile updated!", type: "success" });
        } catch (error) {
            console.error(error);
            setAlert({ msg: "Action failed.", type: "danger" });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Uploads a new file and optionally replaces the old file with new one if it's a Firebase Storage URL
     * @param {string|null} oldFileUrl - The URL of the old file to replace (if applicable).
     * @param {string} folderPath - The path to the folder where the new file will be uploaded.
     * @param {File} newFile - The new file to upload.
     * @returns {Promise<string>} - A promise resolving to the download URL of the uploaded file.
     */
    const uploadOrReplaceFile = async (oldFileUrl = null, folderPath, newFile) => {
        try {
            if (oldFileUrl && typeof oldFileUrl === 'string' && oldFileUrl.includes('firebasestorage')) {
                try {
                    const oldFileRef = ref(storage, oldFileUrl);
                    await deleteObject(oldFileRef);
                } catch (e) { console.warn("Old file cleanup failed."); }
            }

            const newFileRef = ref(storage, `${folderPath}/${newFile.name}`);
            const snapshot = await uploadBytes(newFileRef, newFile);
            return await getDownloadURL(snapshot.ref);
        } catch (error) {
            console.error("Upload Error:", error);
            throw error;
        }
    };

    /**
     * Function to fetch all rooms
     * We are not using this function in the Dashboard & Customer Page because we have a real-time listener, but it's still useful for any future non-real-time use cases.
     * @param {boolean} forceRefresh - Whether to force a refresh of the room data.
     * @returns {Promise<void>} - A promise resolving to the list of rooms.
     */
    const getRooms = useCallback(async (forceRefresh = false) => {
        // If we already have rooms and don't need a refresh, return existing state
        if (!forceRefresh && (rooms.length > 0 || hasFetchedRooms)) {
            return rooms;
        }

        if (fetchingRef.current) return;
        fetchingRef.current = true;
        setLoading(true);

        try {
            const roomsCollection = collection(db, "rooms");
            const querySnapshot = await getDocs(roomsCollection);

            const roomsList = querySnapshot.docs.map(doc => new Room(doc.id, doc.data()));

            setRooms(roomsList);
            setHasFetchedRooms(true);
        } catch (error) {
            console.error("Error fetching rooms:", error);
            setAlert({ msg: "Failed to load rooms.", type: "danger" });
        } finally {
            setLoading(false);
            fetchingRef.current = false;
        }
    }, [rooms.length, hasFetchedRooms]);

    /**
     * Function to Add or Update a room in Firestore
     * @param {object} roomData - The data object for the room.
     * @returns {Promise<boolean>} - A promise resolving to true if successful.
     */
    const saveRoom = async (roomData) => {
        setLoading(true);
        try {
            // Use the roomNumber or existing id as the document name
            const roomId = roomData.id || `dbId_${roomData.roomNumber}`;
            const roomRef = doc(db, "rooms", roomId);

            const finalData = {
                ...roomData,
                price: parseInt(roomData.price),
                currentGuestId: roomData.currentGuestId || null // Ensure this field is always present
            };

            // setDoc with merge: true makes this work for both NEW and EDIT
            await setDoc(roomRef, finalData, { merge: true });

            // Update the local 'rooms' state so the Dashboard reflects changes immediately
            setRooms(prevRooms => {
                const index = prevRooms.findIndex(r => r.id === roomId);
                if (index > -1) {
                    // Update existing room in state
                    const updatedRooms = [...prevRooms];
                    updatedRooms[index] = new Room(roomId, finalData);
                    return updatedRooms;
                } else {
                    // Append new room to state
                    return [...prevRooms, new Room(roomId, finalData)];
                }
            });

            setAlert({ msg: `Room ${roomData.roomNumber} saved successfully!`, type: "success" });
            return true;
        } catch (error) {
            console.error("Firestore Save Error:", error);
            setAlert({ msg: "Failed to save room details.", type: "danger" });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Deletes all files within a specific virtual folder path in Storage.
     * @param {string} folderPath - The path to the folder (e.g., 'Room Images/101').
     */
    const deleteStorageFolder = async (folderPath) => {
        try {
            const folderRef = ref(storage, folderPath);

            // 1. List all files and sub-folders in this path
            const listResult = await listAll(folderRef);

            // 2. Create a batch of delete promises for all files
            const deletePromises = listResult.items.map((fileRef) => deleteObject(fileRef));

            // 3. Wait for all deletions to complete
            await Promise.all(deletePromises);

            // 4. Recursive step: Handle sub-folders if they exist
            const folderPromises = listResult.prefixes.map((subFolderRef) =>
                deleteStorageFolder(`${folderPath}/${subFolderRef.name}`)
            );
            await Promise.all(folderPromises);

            console.log(`Folder ${folderPath} and its contents deleted.`);
            return true;
        } catch (error) {
            console.error("Error deleting folder:", error);
            setAlert({ msg: "Failed to clean up room images from storage.", type: "danger" });
            throw error;
        }
    };

    /**
     * Deletes a room document from Firestore and updates local state.
     * @param {string} roomId - The document ID (e.g., 'dbId_101').
     */
    const deleteRoom = async (roomId) => {
        setLoading(true);
        try {
            const roomRef = doc(db, "rooms", roomId);

            // 1. Remove from Firestore
            await deleteDoc(roomRef);

            // 2. Update local state to immediately remove it from the UI
            setRooms((prevRooms) => prevRooms.filter((room) => room.id !== roomId));

            setAlert({ msg: "Room deleted successfully from database.", type: "success" });
            return true;
        } catch (error) {
            console.error("Firestore Delete Error:", error);
            setAlert({ msg: "Failed to delete room from database.", type: "danger" });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Saves or updates a customer document in Firestore.
     * Supports partial updates (e.g., checkout) via merge: true.
     * We are not using this function in the Customer Entry page because we have a transaction function that handles both customer and room updates together, but this function is still useful for Companion entry.
     * This Function is for Companions only.
     * @param {string} customerId - The unique ID for the customer.
     * @param {object} customerData - The data object to save.
     * @param {boolean} checkin - Whether this is a check-in operation. If false, it's likely a checkout or update.
     */
    const saveCustomer = async (customerId, customerData, checkin = true) => {
        // Won't set Loading here because loading is handled at the component level for customer operations, and this function may be called multiple times during a check-in/check-out flow.
        try {
            const customerRef = doc(db, "customers", customerId);

            // Use merge: true so partial objects (like checkout info) 
            // won't overwrite existing guest data.
            if (checkin) {
                await setDoc(customerRef, {
                    ...customerData,
                    name_lowercase: customerData.name.toLowerCase(),
                    isLead: false,
                    checkIn: serverTimestamp(),
                    checkedInBy: user?.uid || "System_Admin",
                    status: true
                }, { merge: true });
            } else {
                await setDoc(customerRef, {
                    checkOut: serverTimestamp(),
                    checkedOutBy: user?.uid || "System_Admin",
                    status: false
                }, { merge: true });
            }
        } catch (error) {
            console.error("Firestore Customer Save Error:", error);
            throw error;
        }
    };

    /**
     * To fetch companion List of Lead customer.
     * @param {string[]} companionIds - Array of string ids of companions.
     * @returns {Promise<Customer[]>} - Returns the Array of customer object which is companions.
     */
    const getCompanions = async (companionIds) => {
        try {
            // Faster approach if companionIds has many items
            const q = query(collection(db, "customers"), where(documentId(), "in", companionIds));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => new Customer(doc.id, doc.data()));
        } catch (error) {
            console.error("Error fetching Companions:", error);
            setAlert({ msg: "Failed to load companions.", type: "danger" });
        }
    };

    /**
     * Transaction function for multi-guest check-in.
     * @param {Array} guestsArray - Array of full customer data objects.
     * @param {string} selectedRoomId - The Firestore document ID for the room.
     */
    const checkInTransaction = async (guestsArray, selectedRoomId) => {
        try {
            await runTransaction(db, async (transaction) => {
                const roomRef = doc(db, "rooms", selectedRoomId);

                // 1. Identify the Lead Guest for room linkage
                const leadGuest = guestsArray.find(g => g.isLead);
                if (!leadGuest) throw new Error("No lead guest found in check-in data.");

                // 2. Register every guest (Lead + Companions)
                guestsArray.forEach((guestData) => {
                    const customerRef = doc(db, "customers", guestData.id);

                    transaction.set(customerRef, {
                        ...guestData,
                        // Use serverTimestamp for database consistency
                        checkIn: serverTimestamp(),
                        checkedInBy: user?.displayName || user?.email || "Admin_Staff",
                    }, { merge: true });
                });

                // 3. Update Room Status
                // We link the room specifically to the Lead Guest's ID
                transaction.update(roomRef, {
                    status: "Occupied",
                    currentGuestId: leadGuest.id,
                    lastUpdate: serverTimestamp()
                });
            });

            console.log(`Transaction successful: ${guestsArray.length} guests registered to room.`);
        } catch (error) {
            console.error("Check-in Transaction Error:", error);
            throw error; // Rethrow so the UI can show the error alert
        }
    };

    /**
     * Finalizes the guest check-out and releases the room.
     * @param {string[]} customerIds - The list of IDs of the guest leaving.
     * @param {string} roomNumber - The Room Number of the room being vacated.
     * @param {{companyName: string, companyAddress: {district: string, state: string, country: string}, companyGst: string}} corpDetails - Corporate details of the lead customer.
     * @returns {Promise<void>} - A promise resolving when the update is complete.
    */
    const checkOutTransaction = async (customerIds, roomNumber, corpDetails) => {
        try {
            await runTransaction(db, async (transaction) => {
                const roomRef = doc(db, "rooms", `dbId_${roomNumber}`);
                const corp = corpDetails || {};

                // 1. Update Customer Document with checkout info
                customerIds.forEach((id, index) => {
                    const customerRef = doc(db, "customers", id);

                    transaction.set(customerRef, {
                        checkOut: serverTimestamp(),
                        checkedOutBy: user?.displayName || user?.email || "Admin_Staff",
                        status: false,
                        companyName: index === 0 ? corp.companyName : "Check lead's details",
                        companyAddress: index === 0 ? corp.companyAddress : {},
                        companyGst: index === 0 ? corp.companyGst : "Check lead's details"
                    }, { merge: true });
                });

                // 2. Reset Room Status
                transaction.update(roomRef, {
                    status: "Not Occupied",
                    currentGuestId: null
                });
            });

            setAlert({ msg: "Checkout successful. Room is now available.", type: "success" });
        } catch (error) {
            console.error("Checkout Transaction Error:", error);
            setAlert({ msg: "Checkout failed. Please try again.", type: "danger" });
            throw error;
        }
    };

    /**
     * Fetches or Creates a bill document for a checked-out guest.
     * Stores only financial math to keep the document lightweight.
     * @param {Customer} guest - The guest requesting for Bill.
     * @returns {Promise<{bill: Bill, hotelData: HotelData}>}
     */
    const getOrSetBill = async (guest) => {
        setLoading(true);
        const billRef = doc(db, "bills", guest.id);

        try {
            const billSnap = await getDoc(billRef);

            // Scenario A: Bill already exists
            if (billSnap.exists()) {
                return { bill: new Bill(guest.id, billSnap.data()), hotelData: hotelData };
            }

            // Scenario B: First time "Get Bill" is clicked
            const counterRef = doc(db, "invoiceCounter", "counter");
            const roomPrice = rooms.find(r => r.roomNumber === guest.roomNumber).price;
            const finalBill = await runTransaction(db, async (transaction) => {
                const counterSnap = await transaction.get(counterRef);
                const currentFY = Bill.getFinancialYear();
                let newCount = 1;

                if (counterSnap.exists()) {
                    const data = counterSnap.data();
                    // If we are still in the same financial year, increment
                    if (data.lastResetYear === currentFY) newCount = data.lastCount + 1;
                    // If the FY has changed (it's now April), reset to 1
                    else newCount = 1;
                }


                // Update the counter for the next person
                transaction.set(counterRef, { lastCount: newCount, lastResetYear: currentFY }, { merge: true });

                const invoiceNo = Bill.generateInvoiceNo(currentFY, newCount);
                const billObj = Bill.prepareBill(guest, roomPrice, gstData, hotelData.address.state);
                billObj.invoiceNo = invoiceNo;
                billObj.billDate = Timestamp.fromDate(new Date());

                // Save the bill
                transaction.set(billRef, billObj.toFirestore());
                return billObj;
            });

            return { bill: finalBill, hotelData: hotelData };
        } catch (error) {
            console.error("Error managing bill document:", error);
            setAlert({ msg: `Error managing bill document: ${error}`, type: "danger" });
            throw error;
        }
        finally {
            setLoading(false);
        }
    };

    /**
     * Fetches customers with applied filters and pagination.
     * @param {{type: string, value: string}} filters - The filters to apply.
     * @param {Customer} lastDoc - The last document from the previous page.
     * @param {number} pageSize - The number of documents to fetch per page.
     * @param {boolean} forceRefresh - The flag to get fresh data from db again.
     * @returns {Promise<CustomerReturn>} - A promise resolving to the fetched data and pagination info.
     */
    const getCustomersWithFilters = async (filters, lastDoc = null, pageSize = 10, forceRefresh = false) => {
        try {
            // Only return cache if:
            // 1. It's an initial load (!lastDoc)
            // 2. We HAVE data (customers.length > 0)
            // 3. The new filters MATCH what is already in the cache (appliedFilters)
            const isSameSearch =
                (filters.name === (appliedFilters.type === "name" ? appliedFilters.value : null)) &&
                (filters.mobile === (appliedFilters.type === "mobileNumber" ? appliedFilters.value : null)) &&
                (filters.date === (appliedFilters.type === "date" ? appliedFilters.value : null)) &&
                (filters.dateType === (appliedFilters.type === "date" ? appliedFilters.dateType : null));

            if (!forceRefresh && !lastDoc && customers.length > 0 && isSameSearch) {
                return {
                    data: customers,
                    fromCache: true
                };
            }

            let q = collection(db, "customers");

            q = query(q, where("isLead", "==", true));

            // 1. Apply Filters
            // The '\uf8ff' character used in the query above is a very high code point in the Unicode range. Because it is after most regular characters in Unicode, the query matches all values that start with a {filter value}.
            if (filters.name && filters.name !== "") {
                q = query(q, orderBy("name_lowercase"), startAt(filters.name.toLowerCase()), endAt(filters.name.toLowerCase() + "\uf8ff"));
            } else if (filters.mobile && filters.mobile !== "") {
                q = query(q, orderBy("mobileNumber"), startAt(filters.mobile), endAt(filters.mobile + "\uf8ff"));
            } else if (filters.date && filters.date !== "") {
                const startOfDay = new Date(filters.date);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(filters.date);
                endOfDay.setHours(23, 59, 59, 999);

                const fieldToFilter = filters.dateType === 'checkOut' ? 'checkOut' : 'checkIn';
                q = query(q,
                    where(fieldToFilter, ">=", Timestamp.fromDate(startOfDay)),
                    where(fieldToFilter, "<=", Timestamp.fromDate(endOfDay)),
                    orderBy(fieldToFilter, "desc")
                );
            } else {
                q = query(q, orderBy("checkIn", "desc"));
            }

            // 2. Apply Pagination (N+1 Strategy)
            const paginatedQuery = query(q, limit(pageSize + 1), ...(lastDoc ? [startAfter(lastDoc)] : []));

            const snapshot = await getDocs(paginatedQuery);
            const docs = snapshot.docs;
            const moreExists = docs.length > pageSize;
            setHasMore(moreExists);

            const data = moreExists
                ? docs.slice(0, pageSize).map(doc => new Customer(doc.id, doc.data()))
                : docs.map(doc => new Customer(doc.id, doc.data()));

            setLastDoc(moreExists ? docs[pageSize - 1] : null);

            return { data, fromCache: false };
        } catch (error) {
            console.error("Filtered Fetch Error:", error);
            throw error;
        }
    };

    /**
     * Fetches all customers by name regardless of lead or non lead customers.
     * @param {string} nameQuery - Search based on customer name.
     * @returns {Promise<Customer[]>} - A Promise resolving to the array of Customer objects.
     */
    const searchCustomersForEntry = async (nameQuery) => {
        try {
            const q = query(
                collection(db, "customers"),
                where("status", "==", false),
                orderBy("name_lowercase"),
                startAt(nameQuery.toLowerCase()),
                endAt(nameQuery.toLowerCase() + "\uf8ff"),
                limit(5)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => (new Customer(doc.id, doc.data())));
        } catch (error) {
            console.error("Global Search Error:", error);
            return [];
        }
    };

    /**
     * Fetches the Bill array based on month and year for Excel conversion.
     * @param {number} month - Selected Month.
     * @param {number} year - Selected Year.
     * @returns {Promise<void>}
     */
    const fetchReport = async (month, year) => {
        setLoading(true);
        try {
            // 1. Calculate the start and end of the selected month
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0, 23, 59, 59); // set the day parameter to 0, JavaScript interprets that as "the last day of the previous month".

            // 2. Query the 'bills' collection
            const q = query(
                collection(db, "bills"),
                where("billDate", ">=", Timestamp.fromDate(startDate)),
                where("billDate", "<=", Timestamp.fromDate(endDate)),
                orderBy("billDate", "asc")
            );

            const querySnapshot = await getDocs(q);
            const reports = querySnapshot.docs.map(doc => new Bill(doc.id, doc.data()));

            setReportData({ month, year, reports });
        } catch (error) {
            console.error("Error fetching monthly report:", error);
            setAlert({ msg: `Unable get Monthly report, error: ${error.message}` })
        } finally {
            setLoading(false);
        }
    };

    // Logout function that also clears user and staff state
    const logout = async () => {
        try {
            setLoading(true);
            await signOut(auth);
            setUser(null);
            setStaffDetails(null);
        } catch (error) {
            console.error("Logout Error:", error);
        } finally {
            setLoading(false);
        }
    };

    // Combined function to fetch both legacy and hotel data, used in Customer Page
    const getLegacyAndHotelDataAndGstData = useCallback(async () => {
        // Only fetch if we don't have the data yet to save on Firebase reads
        if (legacyData && hotelData && gstData) return;

        try {
            const legacyRef = doc(db, "ktsLegacy", "UjuYvF8lqwEYwS6NkpS6");
            const hotelRef = doc(db, "hotelData", "Q7DeBtU95wMMUMh5ag6N");
            const gstRef = doc(db, "taxes", "gst_rates");

            // Fetch both documents in parallel for better speed
            const [legacySnap, hotelSnap, gstSnap] = await Promise.all([
                getDoc(legacyRef),
                getDoc(hotelRef),
                getDoc(gstRef)
            ]);

            if (legacySnap.exists()) setLegacyData(new KtsLegacy(legacySnap.data()));
            if (hotelSnap.exists()) setHotelData(new HotelData(hotelSnap.data()));
            if (gstSnap.exists()) setGstData(new GstData(gstSnap.data()));

        } catch (error) {
            console.error("Fetch Error:", error);
            setAlert({ msg: "Failed to load hotel configurations.", type: "danger" });
        }
    }, []);

    /**
     * Sends a password reset email to the specified email address using Firebase Authentication.
     * @param {string} email - The email address of the user requesting a password reset.
     * @returns {Promise<void>} - A promise that resolves when the email has been sent.
     */
    const resetPassword = async (email) => {
        try{
            await sendPasswordResetEmail(auth, email);
            setAlert({msg: "If this email is registered, a password reset link has been sent to it.", type: "success"});
        }
        catch (e){
            console.error("Password Reset Error:", e);
            setAlert({msg: "Failed to send password reset email. Please try again later.", type: "danger"});
        }
    }

    return (
        <FbContext.Provider value={{
            user,
            loading,
            alert,
            staffDetails,
            rooms,
            legacyData,
            hotelData,
            customers,
            lastDoc,
            hasMore,
            appliedFilters,
            reportData,
            setLoading,
            setAlert,
            loginWithEmail,
            resetPassword,
            logout,
            getStaffData,
            updateStaffProfile,
            uploadOrReplaceFile,
            saveRoom,
            deleteStorageFolder,
            deleteRoom,
            getPreDocumentId,
            saveCustomer,
            getCompanions,
            checkInTransaction,
            checkOutTransaction,
            getCustomersWithFilters,
            setCustomers,
            setLastDoc,
            setHasMore,
            setAppliedFilters,
            getOrSetBill,
            fetchReport,
            searchCustomersForEntry
        }}>
            {children}
        </FbContext.Provider>
    );
};