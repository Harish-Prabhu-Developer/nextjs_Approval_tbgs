export const parseDate = (dateInput: string | Date | null | undefined) => {
    if (!dateInput) return null;
    if (dateInput instanceof Date) return dateInput;
    
    // Replace space with T for ISO compliance
    let str = dateInput.toString().replace(' ', 'T');
    
    const date = new Date(str);
    return isNaN(date.getTime()) ? null : date;
};

export const formatMessageTime = (dateInput: string | Date | null | undefined) => {
    const date = parseDate(dateInput);
    if (!date) return "";

    const now = new Date();
    
    // Just time if today
    if (date.toDateString() === now.toDateString()) {
        const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        return time.replace(/^0/, ''); // Normalize "09:30 AM" -> "9:30 AM"
    }
    
    // "Yesterday" 
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
    }
    
    // Date if older
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};
