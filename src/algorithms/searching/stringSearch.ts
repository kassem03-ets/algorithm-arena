
export type StringAlgorithm =
    | "Naive Search"
    | "KMP"
    | "Boyer-Moore"
    | "Rabin-Karp";

export type StringSearchStep = {
    shift: number;
    checking: number | null;
    matched: number[];
    matches: number[];
    comparisons: number;
    message: string;
    phase: "searching" | "found" | "complete";
};

export const STRING_ALGORITHMS: StringAlgorithm[] = [
    "Naive Search",
    "KMP",
    "Boyer-Moore",
    "Rabin-Karp"
];

type Recorder = {
    steps: StringSearchStep[];
    matches: number[];
    comparisons: number;
    add: (
        shift: number,
        checking: number | null,
        matched: number[],
        message: string,
        phase?: StringSearchStep["phase"]
    ) => void;
};

function createRecorder(): Recorder {
    const recorder: Recorder = {
        steps: [],
        matches: [],
        comparisons: 0,

        add(shift, checking, matched, message, phase = "searching") {
            recorder.steps.push({
                shift,
                checking,
                matched: [...matched],
                matches: [...recorder.matches],
                comparisons: recorder.comparisons,
                message,
                phase
            });
        }
    };

    return recorder;
}

function finish(recorder: Recorder): StringSearchStep[] {
    recorder.add(
        recorder.steps.at(-1)?.shift ?? 0,
        null,
        [],
        recorder.matches.length
            ? `Search complete. Found ${recorder.matches.length} match(es).`
            : "Search complete. No matches found.",
        "complete"
    );

    return recorder.steps;
}

export function naiveSearch(
    text: string,
    pattern: string
): StringSearchStep[] {
    const r = createRecorder();
    const n = text.length;
    const m = pattern.length;

    for (let shift = 0; shift <= n - m; shift++) {
        const matched: number[] = [];

        for (let j = 0; j < m; j++) {
            r.comparisons++;

            const equal = text[shift + j] === pattern[j];

            if (equal) matched.push(j);

            r.add(
                shift,
                j,
                matched,
                equal
                    ? `Match: "${text[shift + j]}" at text index ${shift + j}.`
                    : `Mismatch at index ${shift + j}. Shift pattern right.`
            );

            if (!equal) break;
        }

        if (matched.length === m) {
            r.matches.push(shift);

            r.add(
                shift,
                null,
                [...Array(m).keys()],
                `Pattern found at index ${shift}!`,
                "found"
            );
        }
    }

    return finish(r);
}

function buildLPS(pattern: string): number[] {
    const lps = Array(pattern.length).fill(0);
    let length = 0;
    let i = 1;

    while (i < pattern.length) {
        if (pattern[i] === pattern[length]) {
            lps[i++] = ++length;
        } else if (length > 0) {
            length = lps[length - 1];
        } else {
            lps[i++] = 0;
        }
    }

    return lps;
}

export function kmpSearch(
    text: string,
    pattern: string
): StringSearchStep[] {
    const r = createRecorder();
    const lps = buildLPS(pattern);

    let i = 0;
    let j = 0;

    while (i < text.length) {
        const shift = i - j;
        const equal = text[i] === pattern[j];

        r.comparisons++;

        r.add(
            shift,
            j,
            equal
                ? [...Array(j + 1).keys()]
                : [...Array(j).keys()],
            equal
                ? `Matched "${text[i]}". Continue comparing.`
                : `Mismatch. Use the LPS table to skip repeated work.`
        );

        if (equal) {
            i++;
            j++;

            if (j === pattern.length) {
                const matchIndex = i - j;
                r.matches.push(matchIndex);

                r.add(
                    matchIndex,
                    null,
                    [...Array(pattern.length).keys()],
                    `Pattern found at index ${matchIndex}!`,
                    "found"
                );

                j = lps[j - 1];
            }
        } else if (j > 0) {
            j = lps[j - 1];
        } else {
            i++;
        }
    }

    return finish(r);
}

export function boyerMooreSearch(
    text: string,
    pattern: string
): StringSearchStep[] {
    const r = createRecorder();
    const m = pattern.length;
    const n = text.length;

    const last = new Map<string, number>();

    for (let i = 0; i < m; i++) {
        last.set(pattern[i], i);
    }

    let shift = 0;

    while (shift <= n - m) {
        let j = m - 1;
        const matched: number[] = [];

        while (j >= 0) {
            r.comparisons++;

            const equal = pattern[j] === text[shift + j];

            if (equal) matched.push(j);

            r.add(
                shift,
                j,
                matched,
                equal
                    ? `Matched "${pattern[j]}" from right to left.`
                    : `Mismatch at text index ${shift + j}. Apply bad-character shift.`
            );

            if (!equal) break;
            j--;
        }

        if (j < 0) {
            r.matches.push(shift);

            r.add(
                shift,
                null,
                [...Array(m).keys()],
                `Pattern found at index ${shift}!`,
                "found"
            );

            const nextChar = text[shift + m];
            shift +=
                shift + m < n
                    ? Math.max(1, m - (last.get(nextChar) ?? -1))
                    : 1;
        } else {
            const badChar = text[shift + j];
            shift += Math.max(
                1,
                j - (last.get(badChar) ?? -1)
            );
        }
    }

    return finish(r);
}

export function rabinKarpSearch(
    text: string,
    pattern: string
): StringSearchStep[] {
    const r = createRecorder();
    const n = text.length;
    const m = pattern.length;

    const BASE = 256;
    const MOD = 1000000007;

    let patternHash = 0;
    let windowHash = 0;
    let highPower = 1;

    for (let i = 0; i < m - 1; i++) {
        highPower = (highPower * BASE) % MOD;
    }

    for (let i = 0; i < m; i++) {
        patternHash =
            (patternHash * BASE + pattern.charCodeAt(i)) % MOD;

        windowHash =
            (windowHash * BASE + text.charCodeAt(i)) % MOD;
    }

    for (let shift = 0; shift <= n - m; shift++) {
        r.add(
            shift,
            null,
            [],
            windowHash === patternHash
                ? `Hash match at index ${shift}. Verify characters.`
                : `Hashes differ at index ${shift}. Skip this window.`
        );

        if (windowHash === patternHash) {
            const matched: number[] = [];

            for (let j = 0; j < m; j++) {
                r.comparisons++;

                const equal = text[shift + j] === pattern[j];

                if (equal) matched.push(j);

                r.add(
                    shift,
                    j,
                    matched,
                    equal
                        ? `Hash verified: "${pattern[j]}" matches.`
                        : "Hash collision detected."
                );

                if (!equal) break;
            }

            if (matched.length === m) {
                r.matches.push(shift);

                r.add(
                    shift,
                    null,
                    [...Array(m).keys()],
                    `Pattern found at index ${shift}!`,
                    "found"
                );
            }
        }

        if (shift < n - m) {
            windowHash =
                (BASE *
                    (windowHash -
                        text.charCodeAt(shift) * highPower +
                        MOD) +
                    text.charCodeAt(shift + m)) %
                MOD;
        }
    }

    return finish(r);
}

export function runStringSearch(
    algorithm: StringAlgorithm,
    text: string,
    pattern: string
): StringSearchStep[] {
    if (!pattern || pattern.length > text.length) {
        return [];
    }

    switch (algorithm) {
        case "Naive Search":
            return naiveSearch(text, pattern);
        case "KMP":
            return kmpSearch(text, pattern);
        case "Boyer-Moore":
            return boyerMooreSearch(text, pattern);
        case "Rabin-Karp":
            return rabinKarpSearch(text, pattern);
    }
}
