/* eslint-env browser */
/* global mocha */

import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";

mocha.ui("bdd");

chai.use(sinonChai);
chai.use(chaiAsPromised);

window.assert = chai.assert;
window.should = chai.should(); // https://github.com/chaijs/chai/issues/107
window.expect = chai.expect;

window.sinon = sinon;
