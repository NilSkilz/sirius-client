import BergDevice, {
  BaseBergDevice,
  BergDeviceCommandResponseJSON,
  BergDeviceOptions,
  BergDeviceParameters,
  BergDeviceCommandResponseCode,
} from '..';

import payloadDecoder, { BergPrinterPayload } from './payload-decoder';
import { BergDeviceCommandPayload } from '../payload-decoder';

const LITTLE_PRINTER_DEVICE_ID = 1;

export interface BergPrinterHandler {
  print(payload: BergPrinterPayload): Promise<boolean>;
}

export enum BergPrinterCommandName {
  SetDeliveryAndPrint = 0x1,
  SetDelivery = 0x2,
  SetDeliveryAndPrintNoFace = 0x11,
  SetDeliveryNoFace = 0x12,

  SetPersonality = 0x102,
  SetPersonalityWithMessage = 0x101,

  SetQuip = 0x202,
}

class BergPrinter extends BaseBergDevice implements BergDevice {
  deviceTypeId = LITTLE_PRINTER_DEVICE_ID;

  private printerHandler: BergPrinterHandler | null;

  constructor(
    parameters: BergDeviceParameters,
    printerHandler: BergPrinterHandler,
    argOptions: Partial<BergDeviceOptions> = {}
  ) {
    super(parameters, argOptions);

    this.printerHandler = printerHandler;
  }

  async handlePayload(
    payload: BergDeviceCommandPayload
  ): Promise<BergDeviceCommandResponseJSON | null> {
    switch (payload.header.command) {
      case BergPrinterCommandName.SetDeliveryAndPrint:
      case BergPrinterCommandName.SetDeliveryAndPrintNoFace:
        // TODO: print a face along with it, as necessary
        const success = this.print(payload.blob);

        return this.makeCommandResponseWithCode(
          success
            ? BergDeviceCommandResponseCode.SUCCESS
            : BergDeviceCommandResponseCode.BUSY,
          payload.header.commandId
        );

        break;

      // how does "set delivery" differ? why wouldn't we print?
      case BergPrinterCommandName.SetDelivery:
      case BergPrinterCommandName.SetDeliveryNoFace:
        console.log(
          `warn: unhandled printer command: SetDelivery(NoFace) (${payload.header.command})`
        );

        break;

      case BergPrinterCommandName.SetPersonality:
      case BergPrinterCommandName.SetPersonalityWithMessage:
        console.log(
          `warn: unhandled printer command: SetPersonality(WithMessage) (${payload.header.command})`
        );

        break;

      case BergPrinterCommandName.SetQuip:
        console.log(
          `warn: unhandled printer command: SetQuip (${payload.header.command})`
        );
        break;

      default:
        console.log(`warn: unknown printer command: ${payload.header.command}`);
        break;
    }

    return this.makeCommandResponseWithCode(
      BergDeviceCommandResponseCode.BRIDGE_ERROR,
      payload.header.commandId
    );
  }

  async print(buffer: Buffer): Promise<boolean> {
    if (this.printerHandler) {
      const decoded = await payloadDecoder(buffer);

      return await this.printerHandler.print(decoded);
    }

    return false;
  }
}

export default BergPrinter;
