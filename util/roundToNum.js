export const roundTo = (number, decimal) => {
    return Math.round(number * 10 ** decimal) / 10 ** decimal;
};
