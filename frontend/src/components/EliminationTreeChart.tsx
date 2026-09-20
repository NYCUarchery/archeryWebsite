"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { HierarchyNode, HierarchyPointLink } from "d3";
import { TreeNode } from "@/utils/parseStagesToTree";
import { DatabaseMatchResult, DatabasePlayerSet } from "@/types/Api";
import { Typography } from "@mui/material";
import { formatLanePlacement, getMatchResultTarget } from "@/utils/eliminationPlacement";
interface Props {
  playerSets: DatabasePlayerSet[];
  goldRoot?: TreeNode;
  silverRoot?: TreeNode;
  bronzeRoot?: TreeNode;
  width?: number;
  height?: number;
  labelWidth?: number;
  labelHeight?: number;
  /** 已排定隊伍的節點被選取時回傳其 match result。 */
  onResultClick?: (result: DatabaseMatchResult) => void;
}

export default function EliminationTreeChart({
  playerSets,
  goldRoot,
  silverRoot,
  bronzeRoot,
  width = 800,
  height = 600,
  labelWidth = 200,
  labelHeight = 48,
  onResultClick,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const margin = { top: 20, right: 0, bottom: 50, left: 100 },
    separationConstant = 2,
    laneBadgeSize = 30;

  useEffect(() => {
    if (!goldRoot || !silverRoot || !bronzeRoot) return;

    d3.select(svgRef.current).selectAll("*").remove();
    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right + labelWidth)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const goldGroup = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // declares a tree layout and assigns the size
    const tree = d3
      .tree<TreeNode>()
      .size([height / 2, width])
      .separation((a, b) => (a.parent == b.parent ? 1 : separationConstant));

    //  assigns the data to a hierarchy using parent-child relationships
    const goldRootHierarchy = d3.hierarchy<TreeNode>(goldRoot);
    const bronzeRootHierarchy = d3.hierarchy<TreeNode>(bronzeRoot);

    // maps the node data to the tree layout
    const goldMappedNodes = tree(goldRootHierarchy);
    // the x and y value of the tree node is for vertical tree layout
    // We need to take them opposite to make the tree horizontal

    // adjust the labels before the final to make the screen not so empty
    for (const node of goldMappedNodes.descendants()) {
      if (node.depth === 0 || node.depth === 1) {
        continue;
      }

      const nodeNums = Math.pow(2, node.depth);

      const nodeOfLayer = goldMappedNodes
        .descendants()
        .filter((d) => d.depth === node.depth);

      node.x +=
        ((height / 2 - labelHeight) / (nodeNums - 1)) *
        nodeOfLayer.indexOf(node);
    }

    const finalLabelX = width - goldMappedNodes.descendants()[1].y;
    const goldLabelX = width - goldMappedNodes.descendants()[0].y;
    const bronzeWidth = width - finalLabelX;
    const bronzeGroup = svg
      .append("g")
      .attr(
        "transform",
        `translate(${margin.left}, ${margin.top + height / 2})`
      );

    const bronzeTree = d3
      .tree<TreeNode>()
      .size([height / 2, bronzeWidth])
      .separation((a, b) => (a.parent == b.parent ? 1 : separationConstant));
    const bronzeMappedNodes = bronzeTree(bronzeRootHierarchy);

    goldGroup
      .append("g")
      .attr("fill", "none")
      .selectAll("path")
      .data(goldMappedNodes.links())
      .join("path")
      .attr("stroke", (d: any) => {
        return getLinkColor(d);
      })
      .attr(
        "d",
        (d: any) =>
          d3
            .link(d3.curveStep)
            .x((d: any) => width - d.y)
            .y((d: any) => d.x)(d) as string
      )
      .filter((d: any) => d.target.data.result.is_winner === true)
      .attr("stroke-width", 3)
      .raise();

    bronzeGroup
      .append("g")
      .attr("transform", `translate(${finalLabelX}, 0)`)
      .attr("fill", "none")
      .selectAll("path")
      .data(bronzeMappedNodes.links())
      .join("path")
      .attr("stroke", (d: any) => getLinkColor(d))
      .attr(
        "d",
        (d: any) =>
          d3
            .link(d3.curveStep)
            .x((d: any) => bronzeWidth - d.y)
            .y((d: any) => d.x)(d) as string
      )
      .filter((d: any) => d.target.data.result.is_winner === true)
      .attr("stroke-width", 3)
      .raise();

    const isClickable = (node: HierarchyNode<TreeNode>) =>
      node.data.result.player_set_id !== undefined &&
      node.data.result.match_id !== undefined;
    const labelForNode = (node: HierarchyNode<TreeNode>) => {
      const text = getTextByNode(node, playerSets) || "隊伍";
      return `${text}，點擊查看 Match #${node.data.result.match_id} 比分`;
    };
    // adds labels to the nodes

    goldGroup
      .append("g")
      .attr("transform", `translate(${-labelWidth / 2}, ${-labelHeight / 2})`)
      .selectAll("rect")
      .data(goldMappedNodes.descendants())
      .join("rect")
      .classed("table", true)
      .attr("y", (d: HierarchyNode<TreeNode>) => d.x!)
      .attr("x", (d: HierarchyNode<TreeNode>) => width - d.y!)
      .attr("width", labelWidth)
      .attr("height", labelHeight)
      .attr("fill", (_, i: number) => getGoldTreeColor(i));

    appendNodeLabels({
      group: goldGroup,
      nodes: goldMappedNodes.descendants(),
      transform: `translate(${-labelWidth / 2}, ${-labelHeight / 2})`,
      x: (node) => width - node.y + 5,
      y: (node) => node.x + labelHeight / 2,
      playerSets,
      labelWidth,
      laneBadgeSize,
      reservesLaneSpace: (node, index) => filterNoLaneNode(node, index),
    });

    goldGroup
      .append("g")
      .attr("transform", `translate(${-labelWidth / 2 + labelWidth}, ${0})`)
      .selectAll("rect")
      .data(
        goldMappedNodes.descendants().filter((d, i) => filterNoLaneNode(d, i))
      )
      .join("rect")
      .attr("width", laneBadgeSize)
      .attr("height", laneBadgeSize)
      .attr("y", (d: HierarchyNode<TreeNode>) => d.x! - laneBadgeSize / 2)
      .attr("x", (d: HierarchyNode<TreeNode>) => width - d.y! - laneBadgeSize)
      .attr("fill", (d: HierarchyNode<TreeNode>) =>
        getLaneNumberBackgroundColor(d)
      );

    goldGroup
      .append("g")
      .attr(
        "transform",
        `translate(${-labelWidth / 2 + labelWidth - laneBadgeSize / 2}, 0)`
      )
      .selectAll("text")
      .data(
        goldMappedNodes.descendants().filter((d, i) => filterNoLaneNode(d, i))
      )
      .join("text")
      .attr("y", (d: HierarchyNode<TreeNode>) => d.x!)
      .attr("x", (d: HierarchyNode<TreeNode>) => width - d.y!)
      .attr("fill", (d: HierarchyNode<TreeNode>) => getLaneNumberColor(d))
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-weight", "bold")
      .attr("font-size", "20px")
      .text((d: HierarchyNode<TreeNode>) =>
        formatLanePlacement(
          d.data.result.lane_number,
          getMatchResultTarget(d.data.result)
        )
      );

    const goldHitAreas = goldGroup
      .append("g")
      .attr("transform", `translate(${-labelWidth / 2}, ${-labelHeight / 2})`)
      .selectAll("rect")
      .data(goldMappedNodes.descendants())
      .join("rect")
      .attr("y", (d: HierarchyNode<TreeNode>) => d.x!)
      .attr("x", (d: HierarchyNode<TreeNode>) => width - d.y!)
      .attr("width", labelWidth)
      .attr("height", labelHeight)
      .attr("fill", "transparent");

    goldHitAreas
      .append("title")
      .text((node) => getTextByNode(node, playerSets));

    goldHitAreas
      .filter((node: HierarchyNode<TreeNode>) => isClickable(node))
      .attr("role", "button")
      .attr("tabindex", 0)
      .attr("aria-label", (node: HierarchyNode<TreeNode>) => labelForNode(node))
      .style("cursor", "pointer")
      .on("click", (_event, node: HierarchyNode<TreeNode>) => onResultClick?.(node.data.result))
      .on("keydown", (event, node: HierarchyNode<TreeNode>) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onResultClick?.(node.data.result);
        }
      })
      .on("focus", function () {
        d3.select(this).attr("stroke", "#fff").attr("stroke-width", 2);
      })
      .on("blur", function () {
        d3.select(this).attr("stroke", null).attr("stroke-width", null);
      });

    bronzeGroup
      .append("g")
      .attr(
        "transform",
        `translate(${-labelWidth / 2 + finalLabelX}, ${-labelHeight / 2})`
      )
      .selectAll("rect")
      .data(bronzeMappedNodes.descendants())
      .join("rect")
      .classed("table", true)
      .attr("y", (d: HierarchyNode<TreeNode>) => d.x!)
      .attr("x", (d: HierarchyNode<TreeNode>) => bronzeWidth - d.y!)
      .attr("width", labelWidth)
      .attr("height", labelHeight)
      .attr("fill", (_, i: number) => getBronzeTreeColor(i));

    appendNodeLabels({
      group: bronzeGroup,
      nodes: bronzeMappedNodes.descendants(),
      transform: `translate(${-labelWidth / 2 + finalLabelX}, ${-labelHeight / 2})`,
      x: (node) => bronzeWidth - node.y + 5,
      y: (node) => node.x + labelHeight / 2,
      playerSets,
      labelWidth,
      laneBadgeSize,
      reservesLaneSpace: (node, index) => filterNoLaneNode(node, index),
    });

    bronzeGroup
      .append("g")
      .attr(
        "transform",
        `translate(${-labelWidth / 2 + finalLabelX + labelWidth}, 0)`
      )
      .selectAll("rect")
      .data(
        bronzeMappedNodes.descendants().filter((d, i) => filterNoLaneNode(d, i))
      )
      .join("rect")
      .attr("width", laneBadgeSize)
      .attr("height", laneBadgeSize)
      .attr("y", (d: HierarchyNode<TreeNode>) => d.x! - laneBadgeSize / 2)
      .attr("x", (d: HierarchyNode<TreeNode>) => bronzeWidth - d.y! - laneBadgeSize)
      .attr("fill", (d: HierarchyNode<TreeNode>) =>
        getLaneNumberBackgroundColor(d)
      );

    bronzeGroup
      .append("g")
      .attr(
        "transform",
        `translate(${
          -labelWidth / 2 + finalLabelX + labelWidth - laneBadgeSize / 2
        }, 0)`
      )
      .selectAll("text")
      .data(
        bronzeMappedNodes.descendants().filter((d, i) => filterNoLaneNode(d, i))
      )
      .join("text")
      .attr("y", (d: HierarchyNode<TreeNode>) => d.x!)
      .attr("x", (d: HierarchyNode<TreeNode>) => bronzeWidth - d.y!)
      .attr("fill", (d: HierarchyNode<TreeNode>) => getLaneNumberColor(d))
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-weight", "bold")
      .attr("font-size", "20px")
      .text((d: HierarchyNode<TreeNode>) =>
        formatLanePlacement(
          d.data.result.lane_number,
          getMatchResultTarget(d.data.result)
        )
      );

    const bronzeHitAreas = bronzeGroup
      .append("g")
      .attr(
        "transform",
        `translate(${-labelWidth / 2 + finalLabelX}, ${-labelHeight / 2})`
      )
      .selectAll("rect")
      .data(bronzeMappedNodes.descendants())
      .join("rect")
      .attr("y", (d: HierarchyNode<TreeNode>) => d.x!)
      .attr("x", (d: HierarchyNode<TreeNode>) => bronzeWidth - d.y!)
      .attr("width", labelWidth)
      .attr("height", labelHeight)
      .attr("fill", "transparent");

    bronzeHitAreas
      .append("title")
      .text((node) => getTextByNode(node, playerSets));

    bronzeHitAreas
      .filter((node: HierarchyNode<TreeNode>) => isClickable(node))
      .attr("role", "button")
      .attr("tabindex", 0)
      .attr("aria-label", (node: HierarchyNode<TreeNode>) => labelForNode(node))
      .style("cursor", "pointer")
      .on("click", (_event, node: HierarchyNode<TreeNode>) => onResultClick?.(node.data.result))
      .on("keydown", (event, node: HierarchyNode<TreeNode>) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onResultClick?.(node.data.result);
        }
      })
      .on("focus", function () {
        d3.select(this).attr("stroke", "#fff").attr("stroke-width", 2);
      })
      .on("blur", function () {
        d3.select(this).attr("stroke", null).attr("stroke-width", null);
      });

    const silverNode = d3.hierarchy<TreeNode>(silverRoot);
    const silverGroup = svg
      .append("g")
      .attr(
        "transform",
        `translate(${goldLabelX}, ${height / 2 + margin.top / 2})`
      );

    silverGroup
      .append("rect")
      .attr("width", labelWidth)
      .attr("height", labelHeight)
      .attr("fill", "#a0a0a0");
    appendNodeLabels({
      group: silverGroup,
      nodes: [silverNode],
      transform: "translate(0, 0)",
      x: () => 5,
      y: () => labelHeight / 2,
      playerSets,
      labelWidth,
      laneBadgeSize,
      reservesLaneSpace: () => false,
    });
    if (isClickable(silverNode)) {
      silverGroup
        .append("rect")
        .datum(silverNode)
        .attr("width", labelWidth)
        .attr("height", labelHeight)
        .attr("fill", "transparent")
        .attr("role", "button")
        .attr("tabindex", 0)
        .attr("aria-label", labelForNode(silverNode))
        .style("cursor", "pointer")
        .on("click", (_event, node) => onResultClick?.(node.data.result))
        .on("keydown", (event, node) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onResultClick?.(node.data.result);
          }
        })
        .on("focus", function () {
          d3.select(this).attr("stroke", "#fff").attr("stroke-width", 2);
        })
        .on("blur", function () {
          d3.select(this).attr("stroke", null).attr("stroke-width", null);
        })
        .append("title")
        .text((node) => getTextByNode(node, playerSets));
    }
  }, [goldRoot, silverRoot, bronzeRoot, playerSets, width, height, labelWidth, labelHeight, onResultClick]);

  if (!goldRoot || !silverRoot || !bronzeRoot)
    return <Typography>尚無完整對抗樹。</Typography>;

  return (
    <svg ref={svgRef} width={width} height={height} overflow="visible"></svg>
  );
}

function getTextByNode(
  node: HierarchyNode<TreeNode>,
  playerSets: DatabasePlayerSet[]
) {
  if (node.data.kind === "bye") {
    return "輪空";
  }
  if (!node.data.result.player_set_id) {
    return "";
  }

  const set = playerSets.find((ps) => ps.id === node.data.result.player_set_id);
  if (!set) return "";
  const setText = `No.${set.rank} ${set.set_name}`;

  return setText;
}

function appendNodeLabels<TNode extends HierarchyNode<TreeNode>>({
  group,
  nodes,
  transform,
  x,
  y,
  playerSets,
  labelWidth,
  laneBadgeSize,
  reservesLaneSpace,
}: {
  group: d3.Selection<SVGGElement, unknown, any, any>;
  nodes: TNode[];
  transform: string;
  x: (node: TNode) => number;
  y: (node: TNode) => number;
  playerSets: DatabasePlayerSet[];
  labelWidth: number;
  laneBadgeSize: number;
  reservesLaneSpace: (node: TNode, index: number) => boolean;
}) {
  group
    .append("g")
    .attr("transform", transform)
    .selectAll<SVGTextElement, TNode>("text")
    .data(nodes)
    .join("text")
    .classed("elimination-node-label", true)
    .attr("x", x)
    .attr("y", y)
    .attr("fill", "white")
    .attr("data-reserves-lane", (node, index) =>
      reservesLaneSpace(node, index) ? "true" : "false",
    )
    .each(function (node, index) {
      const fullText = getTextByNode(node, playerSets);
      const availableWidth =
        labelWidth - 10 - (reservesLaneSpace(node, index) ? laneBadgeSize : 0);
      wrapSvgLabel(this, fullText, availableWidth);
    });
}

function wrapSvgLabel(
  textElement: SVGTextElement,
  fullText: string,
  availableWidth: number,
) {
  const text = d3.select(textElement);
  text.selectAll("*").remove();
  text.attr("data-full-label", fullText || null);
  if (!fullText) {
    text.attr("data-line-count", 0);
    return;
  }

  const x = textElement.getAttribute("x") ?? "0";
  const measure = text
    .append("tspan")
    .attr("x", x)
    .attr("opacity", 0);
  const characters = Array.from(fullText);
  const lines: string[] = [];

  const measuredWidth = (value: string) => {
    measure.text(value);
    return measure.node()?.getComputedTextLength() ?? 0;
  };

  for (let lineIndex = 0; lineIndex < 2 && characters.length; lineIndex++) {
    let line = "";
    while (characters.length) {
      const candidate = line + characters[0];
      if (line && measuredWidth(candidate) > availableWidth) break;
      line = candidate;
      characters.shift();
      if (measuredWidth(line) > availableWidth) break;
    }
    lines.push(line);
  }

  if (characters.length) {
    const lastLineIndex = lines.length - 1;
    let lastLine = lines[lastLineIndex];
    while (lastLine && measuredWidth(`${lastLine}…`) > availableWidth) {
      lastLine = Array.from(lastLine).slice(0, -1).join("");
    }
    lines[lastLineIndex] = `${lastLine}…`;
  }

  measure.remove();
  text.attr("data-line-count", lines.length);
  lines.forEach((line, index) => {
    text
      .append("tspan")
      .attr("x", x)
      .attr(
        "dy",
        lines.length === 1 ? "0.35em" : index === 0 ? "-0.2em" : "1.1em",
      )
      .text(line);
  });
}

const getGoldTreeColor = (index: number) => {
  if (index === 0) {
    return "#ddd700";
  }
  return "#2056CC";
};

const getLinkColor = (link: HierarchyPointLink<TreeNode>) => {
  if (link.target.data.result.is_winner === true) {
    return "#2056CC";
  }
  return "gray";
};

const getBronzeTreeColor = (index: number) => {
  if (index === 0) {
    return "#cd7f32";
  }
  return "#2056CC";
};

const getLaneNumberBackgroundColor = (d: HierarchyNode<TreeNode>) => {
  const laneNumber = d.data.result.lane_number ?? 0;
  if (laneNumber % 2 === 0) {
    return "black";
  }
  return "#fff700";
};

const getLaneNumberColor = (d: HierarchyNode<TreeNode>) => {
  const laneNumber = d.data.result.lane_number ?? 0;
  if (laneNumber % 2 === 0) {
    return "#fff700";
  }
  return "black";
};

const filterNoLaneNode = (d: HierarchyNode<TreeNode>, index: number) => {
  return index !== 0 && (d.data.result.lane_number ?? 0) > 0;
};
