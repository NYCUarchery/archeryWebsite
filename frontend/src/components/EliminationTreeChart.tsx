"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { HierarchyNode, HierarchyPointLink } from "d3";
import { TreeNode } from "@/utils/parseStagesToTree";
import { DatabasePlayerSet } from "@/types/Api";
import { Typography } from "@mui/material";
interface Props {
  playerSets: DatabasePlayerSet[];
  goldRoot?: TreeNode;
  silverRoot?: TreeNode;
  bronzeRoot?: TreeNode;
  width?: number;
  height?: number;
  labelWidth?: number;
  labelHeight?: number;
}

export default function EliminationTreeChart({
  playerSets,
  goldRoot,
  silverRoot,
  bronzeRoot,
  width = 800,
  height = 600,
  labelWidth = 200,
  labelHeight = 30,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const margin = { top: 20, right: 0, bottom: 50, left: 100 },
    separationConstant = 2;

  useEffect(() => {
    if (!goldRoot || !silverRoot || !bronzeRoot) return;

    d3.select("svg").selectAll("*").remove();
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

    goldGroup
      .append("g")
      .attr("transform", `translate(${-labelWidth / 2}, ${-labelHeight / 2})`)
      .selectAll("text")
      .data(goldMappedNodes.descendants())
      .join("text")
      .attr("y", (d: HierarchyNode<TreeNode>) => d.x! + labelHeight / 2 + 5)
      .attr("x", (d: HierarchyNode<TreeNode>) => width - d.y! + 5)
      .attr("fill", "white")
      .text((d: HierarchyNode<TreeNode>) => getTextByNode(d, playerSets));

    goldGroup
      .append("g")
      .attr("transform", `translate(${-labelWidth / 2 + labelWidth}, ${0})`)
      .selectAll("rect")
      .data(
        goldMappedNodes.descendants().filter((d, i) => filterNoLaneNode(d, i))
      )
      .join("rect")
      .attr("width", labelHeight)
      .attr("height", labelHeight)
      .attr("y", (d: HierarchyNode<TreeNode>) => d.x! - labelHeight / 2)
      .attr("x", (d: HierarchyNode<TreeNode>) => width - d.y! - labelHeight)
      .attr("fill", (d: HierarchyNode<TreeNode>) =>
        getLaneNumberBackgroundColor(d)
      );

    goldGroup
      .append("g")
      .attr(
        "transform",
        `translate(${-labelWidth / 2 + labelWidth - labelHeight / 2}, ${
          -labelHeight / 2
        })`
      )
      .selectAll("text")
      .data(
        goldMappedNodes.descendants().filter((d, i) => filterNoLaneNode(d, i))
      )
      .join("text")
      .attr("y", (d: HierarchyNode<TreeNode>) => d.x! + labelHeight / 2 + 2)
      .attr("x", (d: HierarchyNode<TreeNode>) => width - d.y!)
      .attr("fill", (d: HierarchyNode<TreeNode>) => getLaneNumberColor(d))
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-weight", "bold")
      .attr("font-size", "20px")
      .text((d: HierarchyNode<TreeNode>) =>
        d.data.result.lane_number!.toString()
      );

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

    bronzeGroup
      .append("g")
      .attr(
        "transform",
        `translate(${-labelWidth / 2 + finalLabelX}, ${-labelHeight / 2})`
      )
      .selectAll("text")
      .data(bronzeMappedNodes.descendants())
      .join("text")
      .attr("y", (d: HierarchyNode<TreeNode>) => d.x! + labelHeight / 2 + 5)
      .attr("x", (d: HierarchyNode<TreeNode>) => bronzeWidth - d.y! + 5)
      .attr("fill", "white")
      .text((d: HierarchyNode<TreeNode>) => getTextByNode(d, playerSets));

    bronzeGroup
      .append("g")
      .attr("transform", `translate(${-labelWidth / 2 + labelWidth}, ${0})`)
      .selectAll("rect")
      .data(
        bronzeMappedNodes.descendants().filter((d, i) => filterNoLaneNode(d, i))
      )
      .join("rect")
      .attr("width", labelHeight)
      .attr("height", labelHeight)
      .attr("y", (d: HierarchyNode<TreeNode>) => d.x! - labelHeight / 2)
      .attr("x", (d: HierarchyNode<TreeNode>) => width - d.y! - labelHeight)
      .attr("fill", (d: HierarchyNode<TreeNode>) =>
        getLaneNumberBackgroundColor(d)
      );

    bronzeGroup
      .append("g")
      .attr(
        "transform",
        `translate(${-labelWidth / 2 + labelWidth - labelHeight / 2}, ${
          -labelHeight / 2
        })`
      )
      .selectAll("text")
      .data(
        bronzeMappedNodes.descendants().filter((d, i) => filterNoLaneNode(d, i))
      )
      .join("text")
      .attr("y", (d: HierarchyNode<TreeNode>) => d.x! + labelHeight / 2 + 2)
      .attr("x", (d: HierarchyNode<TreeNode>) => width - d.y!)
      .attr("fill", (d: HierarchyNode<TreeNode>) => getLaneNumberColor(d))
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-weight", "bold")
      .attr("font-size", "20px")
      .text((d: HierarchyNode<TreeNode>) =>
        d.data.result.lane_number!.toString()
      );

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
    silverGroup
      .append("g")
      .attr("transform", `translate(${5}, ${labelHeight / 2 + 5})`)
      .append("text")
      .attr("fill", "white")
      .text(getTextByNode(silverNode, playerSets));
  }, [goldRoot]);

  if (!goldRoot || !silverRoot || !bronzeRoot)
    return <Typography>Loading...</Typography>;

  return (
    <svg ref={svgRef} width={width} height={height} overflow="visible"></svg>
  );
}

function getTextByNode(
  node: HierarchyNode<TreeNode>,
  playerSets: DatabasePlayerSet[]
) {
  if (node.data.result.player_set_id === undefined) {
    return "";
  }

  const set = playerSets.find((ps) => ps.id === node.data.result.player_set_id);
  const setText = `No.${set?.rank} ${set?.set_name}`;

  return setText;
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
  const laneNumber = d.data.result.lane_number!;
  if (laneNumber % 2 === 0) {
    return "black";
  }
  return "#fff700";
};

const getLaneNumberColor = (d: HierarchyNode<TreeNode>) => {
  const laneNumber = d.data.result.lane_number!;
  if (laneNumber % 2 === 0) {
    return "#fff700";
  }
  return "black";
};

const filterNoLaneNode = (d: HierarchyNode<TreeNode>, index: number) => {
  return index !== 0 && d.data.result.lane_number !== undefined;
};
