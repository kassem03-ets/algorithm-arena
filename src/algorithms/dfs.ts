
export function dfs(
    rows: number,
    cols: number,
    start: number,
    target: number,
    walls: Set<number>
) {
    const stack = [start];
    const visited = new Set<number>();
    const previous = new Map<number, number>();
    const visitedOrder: number[] = [];

    while (stack.length > 0) {
        const current = stack.pop()!;

        if (visited.has(current)) continue;

        visited.add(current);
        visitedOrder.push(current);

        if (current === target) break;

        const row = Math.floor(current / cols);
        const col = current % cols;

        const neighbors = [
            row > 0 ? current - cols : -1,
            row < rows - 1 ? current + cols : -1,
            col > 0 ? current - 1 : -1,
            col < cols - 1 ? current + 1 : -1,
        ];

        for (const neighbor of neighbors) {
            if (
                neighbor === -1 ||
                walls.has(neighbor) ||
                visited.has(neighbor)
            ) continue;

            if (!previous.has(neighbor) && neighbor !== start) {
                previous.set(neighbor, current);
            }

            stack.push(neighbor);
        }
    }

    const path: number[] = [];

    if (visited.has(target)) {
        let current = target;

        while (current !== start) {
            path.unshift(current);
            current = previous.get(current)!;
        }

        path.unshift(start);
    }

    return { visitedOrder, path };
}
