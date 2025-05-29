import { useEffect, useRef, useState } from "react";
import { Orientation, SimpleParallaxProps } from "../types";
import {
	convertPercentageToRange,
	getPercentageVisible,
	getRangeMax,
	getTranslateValue,
} from "../utils";
import useWindowHeight from "./useWindowHeight";

interface UseGetTransitionValueProps {
	isLoaded: boolean;
	imageHeight: number;
	scale: number;
	boundingClientRect: DOMRect;
	orientation: Orientation;
	maxTransition: SimpleParallaxProps["maxTransition"];
}

const useGetTransitionValue = ({
	isLoaded,
	imageHeight,
	scale,
	boundingClientRect,
	orientation,
	maxTransition,
}: UseGetTransitionValueProps) => {
	const [transitionValue, setTransitionValue] = useState("");

	const lastValues = useRef({
		rangeMax: 0,
		lastImageHeight: 0,
		lastScale: 0,
		lastTranslateValue: -999999,
		lastTransformString: "",
	});

	const windowHeight = useWindowHeight();

	useEffect(() => {
		if (!isLoaded || !boundingClientRect || !windowHeight) {
			return;
		}

		const cache = lastValues.current;
		if (cache.lastImageHeight !== imageHeight || cache.lastScale !== scale) {
			cache.rangeMax = getRangeMax(imageHeight, scale);
			cache.lastImageHeight = imageHeight;
			cache.lastScale = scale;
		}

		let percentage = getPercentageVisible(boundingClientRect, windowHeight);

		if (maxTransition) {
			percentage = Math.min(percentage, 100 - maxTransition);
		}

		const translateValue = convertPercentageToRange(percentage, cache.rangeMax);
		if (cache.lastTranslateValue !== translateValue) {
			const transformString = getTranslateValue(translateValue, orientation);

			if (transformString !== cache.lastTransformString) {
				cache.lastTranslateValue = translateValue;
				cache.lastTransformString = transformString;
				setTransitionValue(transformString);
			}
		}
	}, [
		isLoaded,
		imageHeight,
		scale,
		boundingClientRect,
		orientation,
		maxTransition,
		windowHeight,
	]);

	return transitionValue;
};

export default useGetTransitionValue;
