export const parseDate = (dateInput: string | Date | null | undefined) => {
    if (!dateInput) return null;
    if (dateInput instanceof Date) return dateInput;
    
    // Replace space with T for ISO compliance
    let str = dateInput.toString().replace(' ', 'T');
    
    // If it's a simple "YYYY-MM-DDTHH:MM:SS" without TZ, most browsers parse as local.
    // If it has Offset or Z, browsers parse accurately.
    // This avoids the +5:30 shift caused by prematurely adding 'Z'.
    const date = new Date(str);
    return isNaN(date.getTime()) ? null : date;
};

export const formatMessageTime = (dateInput: string | Date | null | undefined) => {
    const date = parseDate(dateInput);
    if (!date) return "";

    const now = new Date();
    
    // Just time if today
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // "Yesterday" 
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
    }
    
    // Date if older
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};
