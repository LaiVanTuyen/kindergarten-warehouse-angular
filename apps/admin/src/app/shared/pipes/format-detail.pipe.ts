import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatDetail',
  standalone: true,
})
export class FormatDetailPipe implements PipeTransform {
  transform(
    value: string | undefined | null
  ): { description: string; args: string | null } | null {
    if (!value) return null;

    // Pattern: "Description | Args: [JSON]"
    const parts = value.split('| Args: ');
    const description = parts[0].trim();
    const argsString = parts.length > 1 ? parts[1].trim() : null;
    let formattedArgs: string | null = null;

    if (argsString) {
      try {
        // Try to parse JSON arguments
        const args = JSON.parse(argsString);
        if (Array.isArray(args)) {
          // Simplify array args for display
          // If it's simple types, join them
          formattedArgs = args
            .map((arg) => {
              if (typeof arg === 'object' && arg !== null) {
                // Extract recognizable fields if possible or stringify
                return JSON.stringify(arg);
              }
              return String(arg);
            })
            .join(', ');
        } else if (typeof args === 'object') {
          formattedArgs = JSON.stringify(args);
        } else {
          formattedArgs = String(args);
        }
      } catch {
        // If parsing fails, just show raw string
        formattedArgs = argsString;
      }
    }

    return {
      description,
      args: formattedArgs,
    };
  }
}
