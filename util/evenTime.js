const isEvenTime = () => {
    const currentMin = new Date().getMinutes();
    return (
        (0 <= currentMin && currentMin < 10) ||
        (20 <= currentMin && currentMin < 30) ||
        (40 <= currentMin && currentMin < 50)
    );
};

export default isEvenTime;
