import csvToJson from "csvtojson";
import {Converter} from "csvtojson/v2/Converter";

export function readAsJson(content: string): Converter
{
    return csvToJson({delimiter: "\t"}).fromString(content);
}
