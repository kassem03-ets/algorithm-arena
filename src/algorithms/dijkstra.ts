
export function dijkstra(
    rows: number,
    cols: number,
    start: number,
    target: number,
    walls: Set<number>
) {
    const total = rows * cols;

    const distances = Array(total).fill(Infinity);
    const previous = new Map<number, number>();
    const visited = new Set<number>();
    const visitedOrder: number[] = [];

    distances[start] = 0;

    while (visited.size < total) {
        let current = -1;
        let shortestDistance = Infinity;

        // Find the unvisited node with the smallest distance
        for (let i = 0; i < total; i++) {
            if (
                !visited.has(i) &&
                !walls.has(i) &&
                distances[i] < shortestDistance
            ) {
                shortestDistance = distances[i];
                current = i;
            }
        }

        // No more reachable nodes
        if (current === -1) break;

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

            const newDistance = distances[current] + 1;

            if (newDistance < distances[neighbor]) {
                distances[neighbor] = newDistance;
                previous.set(neighbor, current);
            }
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
