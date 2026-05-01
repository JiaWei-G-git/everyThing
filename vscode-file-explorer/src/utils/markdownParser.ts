import { ParsedMarkdown } from '../models/types';

export function parseMarkdown(content: string): ParsedMarkdown {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (match) {
    try {
      const frontmatter = parseYamlLike(match[1]);
      return {
        frontmatter,
        content: match[2].trim()
      };
    } catch (e) {
      console.warn('Failed to parse frontmatter:', e);
    }
  }

  return {
    frontmatter: {},
    content: content.trim()
  };
}

function parseYamlLike(yamlContent: string): Record<string, any> {
  const result: Record<string, any> = {};
  const lines = yamlContent.split('\n');
  let currentKey: string | null = null;
  let currentList: any[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;

    // 列表项: "  - value" 或 "- value"
    if (trimmed.startsWith('- ')) {
      const value = parseValue(trimmed.slice(2).trim());
      if (currentKey) {
        currentList.push(value);
      }
      continue;
    }

    // 键值对: "key: value"
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0) {
      // 保存之前的列表
      if (currentKey && currentList.length > 0) {
        result[currentKey] = currentList;
        currentList = [];
      }

      const key = trimmed.slice(0, colonIndex).trim();
      const valueStr = trimmed.slice(colonIndex + 1).trim();

      if (valueStr === '') {
        // 可能是列表的开始
        currentKey = key;
        currentList = [];
      } else {
        result[key] = parseValue(valueStr);
        currentKey = null;
      }
    }
  }

  // 保存最后的列表
  if (currentKey && currentList.length > 0) {
    result[currentKey] = currentList;
  }

  return result;
}

function parseValue(value: string): any {
  const trimmed = value.trim();

  // 内联数组: ["a", "b", "c"] 或 [a, b, c]
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1).trim();
    if (inner === '') return [];
    return inner.split(',').map(s => parseValue(s.trim()));
  }

  // 布尔值
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;

  // null
  if (trimmed === 'null' || trimmed === '~') return null;

  // 数字
  if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  if (/^-?\d+\.\d+$/.test(trimmed)) return parseFloat(trimmed);

  // 带引号的字符串
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }

  // 普通字符串
  return trimmed;
}

export function extractTitle(content: string): string {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  return titleMatch ? titleMatch[1].trim() : '';
}
