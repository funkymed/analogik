import { LiteGraph, LGraphNode } from 'litegraph.js'

export class NodeTest {
    constructor() {
        const MyAddNode: any = function (this: LGraphNode) {
            //add some input slots
            this.addInput('A', 'number')
            this.addInput('B', 'number')
            //add some output slots
            this.addOutput('A+B', 'number')
        }

        //name to show on the canvas
        MyAddNode.title = 'Sum'

        //function to call when the node is executed
        MyAddNode.prototype.onExecute = function () {
            //retrieve data from inputs
            var A = this.getInputData(0)
            if (A === undefined) A = 0
            var B = this.getInputData(1)
            if (B === undefined) B = 0
            //assing data to outputs
            this.setOutputData(0, A + B)
        }

        LiteGraph.registerNodeType('basic/sum', MyAddNode)
    }
}
