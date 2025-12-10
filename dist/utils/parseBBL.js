export function parseBBL(bbl) {
    const boroughCode = bbl[0];
    const boroughMap = {
        "1": "MN",
        "2": "BX",
        "3": "BK",
        "4": "QN",
        "5": "SI"
    };
    return {
        borough: boroughMap[boroughCode],
        block: bbl.slice(1, 6).padStart(5, "0"),
        lot: bbl.slice(6).padStart(4, "0")
    };
}
