import React, { createContext, useContext, useState } from 'react';

export type SupportedLanguage = 'en' | 'hi' | 'mr' | 'ta' | 'te' | 'bn';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', name: 'English (Default)', nativeName: 'English' },
  { code: 'hi', name: 'हिन्दी (Hindi)', nativeName: 'हिन्दी' },
  { code: 'mr', name: 'मराठी (Marathi)', nativeName: 'मराठी' },
  { code: 'ta', name: 'தமிழ் (Tamil)', nativeName: 'தமிழ்' },
  { code: 'te', name: 'తెలుగు (Telugu)', nativeName: 'తెలుగు' },
  { code: 'bn', name: 'বাংলা (Bengali)', nativeName: 'বাংলা' }
];

export const translations: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // Nav
    nav_chats: 'Chats',
    nav_calls: 'Calls',
    nav_satellite: 'Satellite',
    nav_sos: 'SOS',
    nav_settings: 'Settings',

    // Headers & Subtitles
    brand_chats_sub: 'Sovereign Mesh Chats',
    brand_calls_sub: 'Encrypted Calls & History',
    brand_satellite_sub: 'NavIC / GSAT-7A Transceiver',
    brand_settings_sub: 'Settings & Connectivity',

    // Filters
    filter_all_chats: 'All Chats',
    filter_direct: 'Direct',
    filter_satellite: 'Satellite',
    filter_groups: 'Groups',
    filter_all_calls: 'All Calls',
    filter_missed_calls: 'Missed',

    // Search & Actions
    search_chats: 'Search chats, callsigns, or messages...',
    search_contacts: 'Search name, phone, or Satellite ID...',
    btn_add_contact: 'Add New Contact',
    btn_new_chat: 'New Chat',
    btn_new_group: 'New Group',
    btn_broadcast: 'Broadcast',
    btn_scan_qr: 'Scan QR Code',
    btn_call: 'Voice Call',
    btn_video: 'Video Call',
    btn_radio: 'PTT Radio',
    btn_sat_diag: 'Satellite Diagnostics',
    btn_send: 'Send',
    btn_choose_gallery: 'Choose from Gallery',
    btn_take_photo: 'Take Photo',
    btn_sign_out: 'Sign Out',
    btn_cancel: 'Cancel',
    btn_save: 'Save',
    btn_reset: 'Reset',
    btn_exit: 'Exit',

    // Settings
    settings_section_network: 'Connectivity & Network',
    settings_section_privacy: 'Privacy & Security',
    settings_section_theme: 'Appearance & Theme',
    settings_app_language: 'App Language',
    settings_language_desc: 'Display script preference',
    settings_dark_mode: 'Dark Mode',
    settings_light_mode: 'Light Mode',
    settings_sound_alerts: 'Sound Alerts & Haptics',
    settings_sound_desc: 'Audible alert for satellite pings',
    settings_e2ee: 'End-to-End Encryption',
    settings_e2ee_desc: 'P-256 WebCrypto + AES-256-GCM',
    settings_emergency_contacts: 'Emergency Contacts & SOS',
    settings_emergency_contacts_desc: 'Configure trusted rescue nodes',
    settings_clear_cache: 'Clear Local Cache',
    settings_clear_cache_desc: 'Purge offline temporary buffer',
    settings_routing: 'Satellite & Internet Routing',
    settings_routing_desc: 'Cellular, Wi-Fi & Satellite auto-switch',
    settings_device: 'Nexus Satellite Device',
    settings_device_connected: 'Connected • Battery Remaining',
    settings_fallback: 'Satellite Fallback Alert',
    settings_fallback_desc: 'Haptic cue when signal switches',

    // Contact & Group Profile Info
    info_contact_title: 'Contact Info',
    info_group_title: 'Group Info',
    info_message: 'Message',
    info_audio: 'Audio Call',
    info_video: 'Video Call',
    info_pay: 'UPI Pay',
    info_sat_ping: 'Sat Ping',
    info_phone_number: 'Phone Number',
    info_sovereign_id: 'Sovereign NEXUS ID',
    info_role: 'Designation / Role',
    info_status: 'About & Callsign Status',
    info_encryption_title: 'Encryption',
    info_encryption_sub: 'End-to-end encrypted (NIST P-256 + AES-GCM)',
    info_safety_number: 'Safety Verification Number',
    info_mute_notifications: 'Mute Notifications',
    info_disappearing: 'Disappearing Messages',
    info_media_shared: 'Media, Links, and Docs',
    info_participants: 'Participants',
    info_add_members: 'Add Members',
    info_group_admin: 'Group Admin',
    info_block_contact: 'Block Contact',
    info_report_contact: 'Report Contact',
    info_exit_group: 'Exit Group',
    info_delete_group: 'Delete Group',

    // Group creation
    group_select_members: 'Select Group Members',
    group_selected_count: 'selected',
    group_no_members_yet: 'No members selected yet'
  },

  hi: {
    // Nav
    nav_chats: 'चैट्स',
    nav_calls: 'कॉल्स',
    nav_satellite: 'उपग्रह',
    nav_sos: 'आपातकालीन',
    nav_settings: 'सेटिंग्स',

    // Headers & Subtitles
    brand_chats_sub: 'संप्रभु मेश चैट्स',
    brand_calls_sub: 'एन्क्रिप्टेड कॉल्स व इतिहास',
    brand_satellite_sub: 'नाविक / जीसैट-7ए ट्रांससीवर',
    brand_settings_sub: 'सेटिंग्स एवं कनेक्टिविटी',

    // Filters
    filter_all_chats: 'सभी चैट्स',
    filter_direct: 'व्यक्तिगत',
    filter_satellite: 'सैटेलाइट',
    filter_groups: 'ग्रुप्स',
    filter_all_calls: 'सभी कॉल्स',
    filter_missed_calls: 'मिस कॉल्स',

    // Search & Actions
    search_chats: 'चैट, कॉलसाइन या संदेश खोजें...',
    search_contacts: 'नाम, फ़ोन या सैटेलाइट आईडी खोजें...',
    btn_add_contact: 'नया संपर्क जोड़ें',
    btn_new_chat: 'नई चैट',
    btn_new_group: 'नया ग्रुप',
    btn_broadcast: 'प्रसारण',
    btn_scan_qr: 'क्यूआर कोड स्कैन करें',
    btn_call: 'ऑडियो कॉल',
    btn_video: 'वीडियो कॉल',
    btn_radio: 'पीटीटी वॉकी-टॉकी',
    btn_sat_diag: 'सैटेलाइट डायग्नोस्टिक्स',
    btn_send: 'भेजें',
    btn_choose_gallery: 'गैलरी से चुनें',
    btn_take_photo: 'फोटो लें',
    btn_sign_out: 'लॉग आउट',
    btn_cancel: 'रद्द करें',
    btn_save: 'सहेजें',
    btn_reset: 'रीसेट',
    btn_exit: 'बाहर निकलें',

    // Settings
    settings_section_network: 'कनेक्टिविटी एवं नेटवर्क',
    settings_section_privacy: 'गोपनीयता एवं सुरक्षा',
    settings_section_theme: 'थीम एवं रूप-रंग',
    settings_app_language: 'ऐप भाषा',
    settings_language_desc: 'पसंदीदा भाषा चुनें',
    settings_dark_mode: 'डार्क मोड',
    settings_light_mode: 'लाइट मोड',
    settings_sound_alerts: 'ध्वनि एवं कंपन',
    settings_sound_desc: 'सैटेलाइट अलर्ट के लिए ध्वनि',
    settings_e2ee: 'पूर्ण एन्क्रिप्शन (E2EE)',
    settings_e2ee_desc: 'P-256 वेबक्रिप्टो + AES-256-GCM',
    settings_emergency_contacts: 'आपातकालीन संपर्क व SOS',
    settings_emergency_contacts_desc: 'विश्वसनीय बचाव नोड्स सेट करें',
    settings_clear_cache: 'कैश साफ़ करें',
    settings_clear_cache_desc: 'ऑफ़लाइन बफ़र मिटाएं',
    settings_routing: 'सैटेलाइट व इंटरनेट रूटिंग',
    settings_routing_desc: 'ऑटो-स्विच सेलुलर व सैटेलाइट',
    settings_device: 'नेक्सस सैटेलाइट डिवाइस',
    settings_device_connected: 'कनेक्टेड • बैटरी शेष',
    settings_fallback: 'सैटेलाइट फॉलबैक अलर्ट',
    settings_fallback_desc: 'सिग्नल बदलने पर अलर्ट',

    // Contact & Group Profile Info
    info_contact_title: 'संपर्क जानकारी',
    info_group_title: 'ग्रुप जानकारी',
    info_message: 'संदेश',
    info_audio: 'ऑडियो कॉल',
    info_video: 'वीडियो कॉल',
    info_pay: 'यूपीआई भुगतान',
    info_sat_ping: 'सैटेलाइट पिंग',
    info_phone_number: 'फ़ोन नंबर',
    info_sovereign_id: 'संप्रभु नेक्सस आईडी',
    info_role: 'पद / दायित्व',
    info_status: 'स्थिति व विवरण',
    info_encryption_title: 'एन्क्रिप्शन',
    info_encryption_sub: 'सुरक्षित एन्ड-टू-एन्ड एन्क्रिप्शन (P-256)',
    info_safety_number: 'सुरक्षा सत्यापन संख्या',
    info_mute_notifications: 'सूचनाएं म्यूट करें',
    info_disappearing: 'गायब होने वाले संदेश',
    info_media_shared: 'मीडिया, लिंक्स व दस्तावेज़',
    info_participants: 'सदस्य',
    info_add_members: 'सदस्य जोड़ें',
    info_group_admin: 'ग्रुप एडमिन',
    info_block_contact: 'ब्लॉक करें',
    info_report_contact: 'रिपोर्ट करें',
    info_exit_group: 'ग्रुप से बाहर निकलें',
    info_delete_group: 'ग्रुप हटाएं',

    // Group creation
    group_select_members: 'ग्रुप के सदस्य चुनें',
    group_selected_count: 'चुने गए',
    group_no_members_yet: 'अभी कोई सदस्य नहीं चुना'
  },

  mr: {
    // Nav
    nav_chats: 'गप्पा',
    nav_calls: 'कॉल्स',
    nav_satellite: 'उपग्रह',
    nav_sos: 'आणीबाणी',
    nav_settings: 'सेटिंग्ज',

    // Headers & Subtitles
    brand_chats_sub: 'सार्वभौम मेश चॅट्स',
    brand_calls_sub: 'सुरक्षित कॉल्स व इतिहास',
    brand_satellite_sub: 'नाविक / जीसॅट-7ए ट्रान्सिव्हर',
    brand_settings_sub: 'सेटिंग्ज आणि कनेक्टिव्हिटी',

    // Filters
    filter_all_chats: 'सर्व गप्पा',
    filter_direct: 'वैयक्तिक',
    filter_satellite: 'उपग्रह',
    filter_groups: 'गट (Groups)',
    filter_all_calls: 'सर्व कॉल्स',
    filter_missed_calls: 'मिस कॉल्स',

    // Search & Actions
    search_chats: 'गप्पा, कॉलसाइन किंवा संदेश शोधा...',
    search_contacts: 'नाव, फोन किंवा उपग्रह आयडी शोधा...',
    btn_add_contact: 'नवीन संपर्क जोडा',
    btn_new_chat: 'नवीन गप्पा',
    btn_new_group: 'नवीन गट',
    btn_broadcast: 'प्रसारण',
    btn_scan_qr: 'क्यूआर कोड स्कॅन करा',
    btn_call: 'व्हॉइस कॉल',
    btn_video: 'व्हिडिओ कॉल',
    btn_radio: 'पीटीटी रेडिओ',
    btn_sat_diag: 'उपग्रह निदान',
    btn_send: 'पाठवा',
    btn_choose_gallery: 'गॅलरीतून निवडा',
    btn_take_photo: 'फोटो काढा',
    btn_sign_out: 'साइन आउट',
    btn_cancel: 'रद्द करा',
    btn_save: 'जतन करा',
    btn_reset: 'रीसेट',
    btn_exit: 'बाहेर पडा',

    // Settings
    settings_section_network: 'कनेक्टिव्हिटी आणि नेटवर्क',
    settings_section_privacy: 'गोपनीयता आणि सुरक्षा',
    settings_section_theme: 'थीम आणि स्वरूप',
    settings_app_language: 'अ‍ॅप भाषा',
    settings_language_desc: 'पसंतीची भाषा निवडा',
    settings_dark_mode: 'डार्क मोड',
    settings_light_mode: 'लाइट मोड',
    settings_sound_alerts: 'ध्वनी सूचना',
    settings_sound_desc: 'उपग्रह अलर्टसाठी ध्वनी',
    settings_e2ee: 'संपूर्ण एन्क्रिप्शन (E2EE)',
    settings_e2ee_desc: 'P-256 वेबक्रिप्टो + AES-256',
    settings_emergency_contacts: 'आणीबाणी संपर्क व SOS',
    settings_emergency_contacts_desc: 'विश्वासू बचाव नोड्स',
    settings_clear_cache: 'कॅश साफ करा',
    settings_clear_cache_desc: 'तात्पुरती मेमरी हटवा',
    settings_routing: 'उपग्रह आणि इंटरनेट मार्ग',
    settings_routing_desc: 'सेल्युलर व उपग्रह ऑटो-स्विच',
    settings_device: 'नेक्सस उपग्रह उपकरण',
    settings_device_connected: 'जोडलेले • बॅटरी शिल्लक',
    settings_fallback: 'उपग्रह फॉलबॅक अलर्ट',
    settings_fallback_desc: 'सिग्नल बदलल्यावर सूचना',

    // Contact & Group Profile Info
    info_contact_title: 'संपर्क माहिती',
    info_group_title: 'गट माहिती',
    info_message: 'संदेश',
    info_audio: 'ऑडिओ कॉल',
    info_video: 'व्हिडिओ कॉल',
    info_pay: 'यूपीआय पे',
    info_sat_ping: 'उपग्रह पिंग',
    info_phone_number: 'फोन नंबर',
    info_sovereign_id: 'सार्वभौम नेक्सस आयडी',
    info_role: 'पद / भूमिका',
    info_status: 'स्थिती व माहिती',
    info_encryption_title: 'सुरक्षा एन्क्रिप्शन',
    info_encryption_sub: 'एंड-टू-एंड कूटबद्ध (P-256)',
    info_safety_number: 'सुरक्षा पडताळणी क्रमांक',
    info_mute_notifications: 'सूचना म्यूट करा',
    info_disappearing: 'अदृश्य होणारे संदेश',
    info_media_shared: 'मीडिया, लिंक्स व दस्तऐवज',
    info_participants: 'सदस्य',
    info_add_members: 'सदस्य जोडा',
    info_group_admin: 'गट व्यवस्थापक (Admin)',
    info_block_contact: 'ब्लॉक करा',
    info_report_contact: 'तक्रार करा',
    info_exit_group: 'गट सोडा',
    info_delete_group: 'गट हटवा',

    // Group creation
    group_select_members: 'गटाचे सदस्य निवडा',
    group_selected_count: 'निवडलेले',
    group_no_members_yet: 'अजून कोणी सदस्य निवडले नाहीत'
  },

  ta: {
    // Nav
    nav_chats: 'அரட்டைகள்',
    nav_calls: 'அழைப்புகள்',
    nav_satellite: 'செயற்கைக்கோள்',
    nav_sos: 'அவசரம் (SOS)',
    nav_settings: 'அமைப்புகள்',

    // Headers & Subtitles
    brand_chats_sub: 'இறைமை மெஷ் அரட்டைகள்',
    brand_calls_sub: 'மறைகுறியாக்கப்பட்ட அழைப்புகள்',
    brand_satellite_sub: 'நாவிக் / ஜிசாட்-7ஏ டிரான்ஸ்ஸீவர்',
    brand_settings_sub: 'அமைப்புகள் மற்றும் இணைப்பு',

    // Filters
    filter_all_chats: 'அனைத்து அரட்டைகள்',
    filter_direct: 'நேரடி',
    filter_satellite: 'செயற்கைக்கோள்',
    filter_groups: 'குழுக்கள்',
    filter_all_calls: 'அனைத்து அழைப்புகள்',
    filter_missed_calls: 'தவறிய அழைப்புகள்',

    // Search & Actions
    search_chats: 'அரட்டை, செய்திகளைத் தேடுங்கள்...',
    search_contacts: 'பெயர், தொலைபேசி அல்லது ஐடியைத் தேடுங்கள்...',
    btn_add_contact: 'புதிய தொடர்பு சேர்க்கவும்',
    btn_new_chat: 'புதிய அரட்டை',
    btn_new_group: 'புதிய குழு',
    btn_broadcast: 'ஒளிபரப்பு',
    btn_scan_qr: 'QR குறியீட்டை ஸ்கேன் செய்',
    btn_call: 'குரல் அழைப்பு',
    btn_video: 'வீடியோ அழைப்பு',
    btn_radio: 'வாக்கி-டாக்கி',
    btn_sat_diag: 'செயற்கைக்கோள் கண்டறிதல்',
    btn_send: 'அனுப்பு',
    btn_choose_gallery: 'கேலரியில் இருந்து தேர்வு செய்',
    btn_take_photo: 'படம் எடு',
    btn_sign_out: 'வெளியேறு',
    btn_cancel: 'ரத்து செய்',
    btn_save: 'சேமி',
    btn_reset: 'மீட்டமை',
    btn_exit: 'வெளியேறு',

    // Settings
    settings_section_network: 'இணைப்பு மற்றும் நெட்வொர்க்',
    settings_section_privacy: 'தனியுரிமை மற்றும் பாதுகாப்பு',
    settings_section_theme: 'தோற்றம் மற்றும் தீம்',
    settings_app_language: 'பயன்பாட்டு மொழி',
    settings_language_desc: 'விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்',
    settings_dark_mode: 'டார்க் மோட்',
    settings_light_mode: 'லைட் மோட்',
    settings_sound_alerts: 'ஒலி எச்சரிக்கைகள்',
    settings_sound_desc: 'செயற்கைக்கோள் விழிப்பூட்டல்களுக்கான ஒலி',
    settings_e2ee: 'முழுமையான மறைகுறியாக்கம் (E2EE)',
    settings_e2ee_desc: 'P-256 வெப்கிரிப்டோ + AES-256',
    settings_emergency_contacts: 'அவசர தொடர்புகள் & SOS',
    settings_emergency_contacts_desc: 'நம்பகமான மீட்பு முனையங்கள்',
    settings_clear_cache: 'தற்காலிக நினைவகத்தை அழி',
    settings_clear_cache_desc: 'ஆஃப்லைன் நினைவகத்தை நீக்கு',
    settings_routing: 'செயற்கைக்கோள் & இணைய ரூட்டிங்',
    settings_routing_desc: 'தானியங்கி நெட்வொர்க் சுவிட்ச்',
    settings_device: 'நெக்ஸஸ் செயற்கைக்கோள் சாதனம்',
    settings_device_connected: 'இணைக்கப்பட்டது • பேட்டரி அளவு',
    settings_fallback: 'செயற்கைக்கோள் ஃபால்பேக் எச்சரிக்கை',
    settings_fallback_desc: 'சிக்னல் மாறும்போது அதிர்வு',

    // Contact & Group Profile Info
    info_contact_title: 'தொடர்பு தகவல்',
    info_group_title: 'குழு தகவல்',
    info_message: 'செய்தி',
    info_audio: 'குரல் அழைப்பு',
    info_video: 'வீடியோ அழைப்பு',
    info_pay: 'UPI பணம் செலுத்து',
    info_sat_ping: 'செயற்கைக்கோள் பிங்',
    info_phone_number: 'தொலைபேசி எண்',
    info_sovereign_id: 'இறைமை நெக்ஸஸ் ஐடி',
    info_role: 'பதவி / பங்கு',
    info_status: 'நிலை மற்றும் விபரம்',
    info_encryption_title: 'மறைகுறியாக்கம்',
    info_encryption_sub: 'எண்ட்-டு-எண்ட் மறைகுறியாக்கப்பட்டது (P-256)',
    info_safety_number: 'பாதுகாப்பு சரிபார்ப்பு எண்',
    info_mute_notifications: 'அறிவிப்புகளை முடக்கு',
    info_disappearing: 'மறையும் செய்திகள்',
    info_media_shared: 'மீடியா, இணைப்புகள் & ஆவணங்கள்',
    info_participants: 'உறுப்பினர்கள்',
    info_add_members: 'உறுப்பினர்களைச் சேர்',
    info_group_admin: 'குழு நிர்வாகி',
    info_block_contact: 'தடை செய் (Block)',
    info_report_contact: 'புகாரளி (Report)',
    info_exit_group: 'குழுவிலிருந்து வெளியேறு',
    info_delete_group: 'குழுவை நீக்கு',

    // Group creation
    group_select_members: 'குழு உறுப்பினர்களைத் தேர்ந்தெடுக்கவும்',
    group_selected_count: 'தேர்ந்தெடுக்கப்பட்டது',
    group_no_members_yet: 'இன்னும் உறுப்பினர்கள் தேர்ந்தெடுக்கப்படவில்லை'
  },

  te: {
    // Nav
    nav_chats: 'చాట్స్',
    nav_calls: 'కాల్స్',
    nav_satellite: 'ఉపగ్రహం',
    nav_sos: 'అత్యవసరం (SOS)',
    nav_settings: 'సెట్టింగ్‌లు',

    // Headers & Subtitles
    brand_chats_sub: 'సార్వభౌమ మెష్ చాట్‌లు',
    brand_calls_sub: 'ఎన్‌క్రిప్ట్ చేసిన కాల్స్ & చరిత్ర',
    brand_satellite_sub: 'నావిక్ / జీశాట్-7ఏ ట్రాన్సీవర్',
    brand_settings_sub: 'సెట్టింగ్‌లు & కనెక్టివిటీ',

    // Filters
    filter_all_chats: 'అన్ని చాట్స్',
    filter_direct: 'వ్యక్తిగత',
    filter_satellite: 'శాటిలైట్',
    filter_groups: 'గ్రూపులు',
    filter_all_calls: 'అన్ని కాల్స్',
    filter_missed_calls: 'మిస్డ్ కాల్స్',

    // Search & Actions
    search_chats: 'చాట్‌లు, కాల్‌సైన్‌లను శోధించండి...',
    search_contacts: 'పేరు, ఫోన్ లేదా శాటిలైట్ ఐడీ శోధించండి...',
    btn_add_contact: 'కొత్త పరిచయాన్ని జోడించండి',
    btn_new_chat: 'కొత్త చాట్',
    btn_new_group: 'కొత్త గ్రూప్',
    btn_broadcast: 'ప్రసారం',
    btn_scan_qr: 'క్యూఆర్ కోడ్ స్కాన్ చేయండి',
    btn_call: 'వాయిస్ కాల్',
    btn_video: 'వీడియో కాల్',
    btn_radio: 'పీటీటీ రేడియో',
    btn_sat_diag: 'శాటిలైట్ డయాగ్నోస్టిక్స్',
    btn_send: 'పంపండి',
    btn_choose_gallery: 'గ్యాలరీ నుండి ఎంచుకోండి',
    btn_take_photo: 'ఫోటో తీయండి',
    btn_sign_out: 'సైన్ అవుట్',
    btn_cancel: 'రద్దు చేయండి',
    btn_save: 'సేవ్ చేయండి',
    btn_reset: 'రీసెట్',
    btn_exit: 'నిష్క్రమించు',

    // Settings
    settings_section_network: 'కనెక్టివిటీ & నెట్‌వర్క్',
    settings_section_privacy: 'గోప్యత & భద్రత',
    settings_section_theme: 'థీమ్ & రూపురేఖలు',
    settings_app_language: 'యాప్ భాష',
    settings_language_desc: 'మీకు కావలసిన భాషను ఎంచుకోండి',
    settings_dark_mode: 'డార్క్ మోడ్',
    settings_light_mode: 'లైట్ మోడ్',
    settings_sound_alerts: 'ధ్వని హెచ్చరికలు',
    settings_sound_desc: 'శాటిలైట్ పింగ్‌ల కోసం అలర్ట్',
    settings_e2ee: 'పూర్తి ఎన్‌క్రిప్షన్ (E2EE)',
    settings_e2ee_desc: 'P-256 వెబ్‌క్రిప్టో + AES-256',
    settings_emergency_contacts: 'అత్యవసర కాంటాక్ట్‌లు & SOS',
    settings_emergency_contacts_desc: 'విశ్వసనీయ రెస్క్యూ నోడ్స్',
    settings_clear_cache: 'కాష్ క్లియర్ చేయండి',
    settings_clear_cache_desc: 'ఆఫ్‌లైన్ బఫర్‌ను తొలగించండి',
    settings_routing: 'శాటిలైట్ & ఇంటర్నెట్ రూటింగ్',
    settings_routing_desc: 'ఆటోమేటిక్ నెట్‌వర్క్ స్విచ్',
    settings_device: 'నెక్సస్ శాటిలైట్ పరికరం',
    settings_device_connected: 'కనెక్ట్ అయింది • బ్యాటరీ మిగిలి ఉంది',
    settings_fallback: 'శాటిలైట్ ఫాల్‌బ్యాక్ హెచ్చరిక',
    settings_fallback_desc: 'సిగ్నల్ మారినప్పుడు వైబ్రేషన్',

    // Contact & Group Profile Info
    info_contact_title: 'కాంటాక్ట్ సమాచారం',
    info_group_title: 'గ్రూప్ సమాచారం',
    info_message: 'సందేశం',
    info_audio: 'ఆడియో కాల్',
    info_video: 'వీడియో కాల్',
    info_pay: 'UPI చెల్లింపు',
    info_sat_ping: 'శాటిలైట్ పింగ్',
    info_phone_number: 'ఫోన్ నంబర్',
    info_sovereign_id: 'సార్వభౌమ నెక్సస్ ఐడీ',
    info_role: 'హోదా / పాత్ర',
    info_status: 'స్టేటస్ & వివరాలు',
    info_encryption_title: 'ఎన్‌క్రిప్షన్',
    info_encryption_sub: 'ఎండ్-టు-ఎండ్ ఎన్‌క్రిప్ట్ చేయబడింది (P-256)',
    info_safety_number: 'భద్రతా ధృవీకరణ సంఖ్య',
    info_mute_notifications: 'నోటిఫికేషన్‌లను మ్యూట్ చేయండి',
    info_disappearing: 'అదృశ్యమయ్యే సందేశాలు',
    info_media_shared: 'మీడియా, లింకులు & పత్రాలు',
    info_participants: 'సభ్యులు',
    info_add_members: 'సభ్యులను చేర్చండి',
    info_group_admin: 'గ్రూప్ అడ్మిన్',
    info_block_contact: 'బ్లాక్ చేయండి',
    info_report_contact: 'రిపోర్ట్ చేయండి',
    info_exit_group: 'గ్రూప్ నుండి నిష్క్రమించండి',
    info_delete_group: 'గ్రూప్‌ను తొలగించండి',

    // Group creation
    group_select_members: 'గ్రూప్ సభ్యులను ఎంచుకోండి',
    group_selected_count: 'ఎంచుకోబడ్డాయి',
    group_no_members_yet: 'ఇంకా ఎవరినీ ఎంచుకోలేదు'
  },

  bn: {
    // Nav
    nav_chats: 'চ্যাট',
    nav_calls: 'কল',
    nav_satellite: 'স্যাটেলাইট',
    nav_sos: 'জরুরি (SOS)',
    nav_settings: 'সেটিংস',

    // Headers & Subtitles
    brand_chats_sub: 'সার্বভৌম জাল চ্যাট',
    brand_calls_sub: 'এনক্রিপ্ট করা কল ও ইতিহাস',
    brand_satellite_sub: 'নাভিক / জিস্যাট-৭এ ট্রানসিভার',
    brand_settings_sub: 'সেটিংস ও সংযোগ',

    // Filters
    filter_all_chats: 'সকল চ্যাট',
    filter_direct: 'ব্যক্তিগত',
    filter_satellite: 'স্যাটেলাইট',
    filter_groups: 'গ্রুপ',
    filter_all_calls: 'সকল কল',
    filter_missed_calls: 'মিসড কল',

    // Search & Actions
    search_chats: 'চ্যাট, বার্তা অনুসন্ধান করুন...',
    search_contacts: 'নাম, ফোন বা স্যাটেলাইট আইডি খুঁজুন...',
    btn_add_contact: 'নতুন পরিচিতি যোগ করুন',
    btn_new_chat: 'নতুন চ্যাট',
    btn_new_group: 'নতুন গ্রুপ',
    btn_broadcast: 'সম্প্রচার',
    btn_scan_qr: 'QR কোড স্ক্যান করুন',
    btn_call: 'ভয়েস কল',
    btn_video: 'ভিডিও কল',
    btn_radio: 'ওয়াকি-টকি',
    btn_sat_diag: 'স্যাটেলাইট ডায়াগনস্টিকস',
    btn_send: 'পাঠান',
    btn_choose_gallery: 'গ্যালারি থেকে নির্বাচন করুন',
    btn_take_photo: 'ছবি তুলুন',
    btn_sign_out: 'সাইন আউট',
    btn_cancel: 'বাতিল',
    btn_save: 'সংরক্ষণ করুন',
    btn_reset: 'রিসেট',
    btn_exit: 'প্রস্থান',

    // Settings
    settings_section_network: 'সংযোগ ও নেটওয়ার্ক',
    settings_section_privacy: 'গোপনীয়তা ও নিরাপত্তা',
    settings_section_theme: 'থিম ও প্রদর্শন',
    settings_app_language: 'অ্যাপের ভাষা',
    settings_language_desc: 'পছন্দের ভাষা নির্বাচন করুন',
    settings_dark_mode: 'ডার্ক মোড',
    settings_light_mode: 'লাইট মোড',
    settings_sound_alerts: 'শব্দ সতর্কতা',
    settings_sound_desc: 'স্যাটেলাইট পিং এর জন্য শব্দ',
    settings_e2ee: 'সম্পূর্ণ এনক্রিপশন (E2EE)',
    settings_e2ee_desc: 'P-256 ওয়েবক্রিপ্টো + AES-256',
    settings_emergency_contacts: 'জরুরি পরিচিতি ও SOS',
    settings_emergency_contacts_desc: 'বিশ্বস্ত উদ্ধার কেন্দ্র',
    settings_clear_cache: 'ক্যাশে পরিষ্কার করুন',
    settings_clear_cache_desc: 'অস্থায়ী মেমরি মুছুন',
    settings_routing: 'স্যাটেলাইট ও ইন্টারনেট রাউটিং',
    settings_routing_desc: 'স্বয়ংক্রিয় নেটওয়ার্ক পরিবর্তন',
    settings_device: 'নেক্সাস স্যাটেলাইট ডিভাইস',
    settings_device_connected: 'সংযুক্ত • ব্যাটারি অবশিষ্ট',
    settings_fallback: 'স্যাটেলাইট ফলব্যাক সতর্কতা',
    settings_fallback_desc: 'সংকেত পরিবর্তনের সংকেত',

    // Contact & Group Profile Info
    info_contact_title: 'পরিচিতি তথ্য',
    info_group_title: 'গ্রুপ তথ্য',
    info_message: 'বার্তা',
    info_audio: 'অডিও কল',
    info_video: 'ভিডিও কল',
    info_pay: 'UPI পেমেন্ট',
    info_sat_ping: 'স্যাটেলাইট পিং',
    info_phone_number: 'ফোন নম্বর',
    info_sovereign_id: 'সার্বভৌম নেক্সাস আইডি',
    info_role: 'পদবী / ভূমিকা',
    info_status: 'স্থিতি ও বিবরণ',
    info_encryption_title: 'এনক্রিপশন',
    info_encryption_sub: 'এন্ড-টু-এন্ড এনক্রিপ্ট করা (P-256)',
    info_safety_number: 'নিরাপত্তা যাচাইকরণ নম্বর',
    info_mute_notifications: 'বিজ্ঞপ্তি নীরব করুন',
    info_disappearing: 'অদৃশ্য বার্তা',
    info_media_shared: 'মিডিয়া, লিঙ্ক ও নথিপত্র',
    info_participants: 'সদস্যবৃন্দ',
    info_add_members: 'সদস্য যোগ করুন',
    info_group_admin: 'গ্রুপ অ্যাডমিন',
    info_block_contact: 'ব্লক করুন',
    info_report_contact: 'রিপোর্ট করুন',
    info_exit_group: 'গ্রুপ ত্যাগ করুন',
    info_delete_group: 'গ্রুপ মুছুন',

    // Group creation
    group_select_members: 'গ্রুপের সদস্য নির্বাচন করুন',
    group_selected_count: 'নির্বাচিত',
    group_no_members_yet: 'এখনও কোনো সদস্য নির্বাচন করা হয়নি'
  }
};

interface I18nContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key, fallback) => fallback || key
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem('nexus_language');
      if (saved && (saved in translations)) {
        return saved as SupportedLanguage;
      }
      if (saved) {
        if (saved.includes('Hindi') || saved.includes('हिन्दी')) return 'hi';
        if (saved.includes('Marathi') || saved.includes('मराठी')) return 'mr';
        if (saved.includes('Tamil') || saved.includes('தமிழ்')) return 'ta';
        if (saved.includes('Telugu') || saved.includes('తెలుగు')) return 'te';
        if (saved.includes('Bengali') || saved.includes('বাংলা')) return 'bn';
      }
      return 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem('nexus_language', newLang);
    } catch {}
  };

  const t = (key: string, fallback?: string): string => {
    const langDict = translations[language] || translations.en;
    if (langDict[key]) return langDict[key];
    if (translations.en[key]) return translations.en[key];
    return fallback || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => useContext(I18nContext);
