const Plugin = function (Alpine) {
	const patterns = {};

	patterns.email = `^(([^<>()\\[\\]\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$`;

	Alpine.magic("patterns", () => patterns);
};

export default Plugin;

/* -------------------------------------------------------------------------- */
/*                                 Validators                                 */
/* -------------------------------------------------------------------------- */

const dateFormats = ["mmddyyyy", "ddmmyyyy", "yyyymmdd"];

const yearLastDateRegex = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/;
const yearFirstDateRegex = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/;

function isDate(str, format = dateFormats[2]) {
	// format defaults to yyyymmdd
	const dateArray = str.split(/[-/.]/);
	const formatIndexInArray = dateFormats.indexOf(format);

	let mm, dd, yyyy;

	if (yearLastDateRegex.test(str)) {
		if (formatIndexInArray === 0) [mm, dd, yyyy] = dateArray;
		if (formatIndexInArray === 1) [dd, mm, yyyy] = dateArray;
	} else if (yearFirstDateRegex.test(str) && formatIndexInArray === 2) {
		[yyyy, mm, dd] = dateArray;
	}

	const isoFormattedStr = `${yyyy}-${mm}-${dd}`;
	const date = new Date(isoFormattedStr);

	const timestamp = date.getTime();

	if (!typeof timestamp === "number" || Number.isNaN(timestamp)) return false;

	return date.toISOString().startsWith(isoFormattedStr);
}

/* -------------------------------------------------------------------------- */
/*                            Validation Functions                            */
/* -------------------------------------------------------------------------- */

const validate = {};

validate.email = (str) =>
	/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
		cleanText(str)
	);
validate.tel = (str) =>
	/^((\+|0)\d{1,4})?[-\s.]?[-\s.]?\d[-\s.]?\d[-\s.]?\d[-\s.]?\d[-\s.]?\d[-\s.]?\d[-\s.]?\d[-\s.]?\d[-\s.]?(\d{1,2})$/.test(
		cleanText(str)
	);
validate.website = (str) =>
	/^(https?:\/\/)?(www\.)?([-a-zA-Z0-9@:%._+~#=]+(-?[a-zA-Z0-9])*\.)+[\w]{2,}(\/\S*)?$/.test(
		cleanText(str)
	);
validate.url = (str) =>
	/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_+.~#?&/=]*)/.test(
		cleanText(str)
	);
validate.number = (str) => !isNaN(parseFloat(str)) && isFinite(str);
validate.integer = (str) =>
	validate.number(str) && Number.isInteger(Number(str));
validate.wholenumber = (str) => validate.integer(str) && Number(str) > 0;
validate.date = (str) => isDate(str);

dateFormats.forEach((format) => {
	validate.date[format] = (str) => isDate(str, format);
});
