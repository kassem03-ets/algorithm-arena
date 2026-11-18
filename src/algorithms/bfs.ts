
export function bfs(
    rows: number,
    cols: number,
    start: number,
    target: number,
    walls: Set<number>
) {
    const queue = [start];
    let head = 0;

    const visited = new Set<number>([start]);
    const previous = new Map<number, number>();
    const visitedOrder: number[] = [];

    while (head < queue.length) {
        const current = queue[head++];
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

            visited.add(neighbor);
            previous.set(neighbor, current);
            queue.push(neighbor);
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
